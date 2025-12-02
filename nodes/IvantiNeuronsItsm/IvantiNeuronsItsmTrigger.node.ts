import type {
    IDataObject,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IPollFunctions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { cleanODataResponse } from './methods/helpers';
import { getObjectFields } from './methods/loadOptions';

interface PollData {
    lastTimeChecked?: string;
}

// Helper function to recursively remove null values from objects
function stripNullValues(obj: IDataObject): IDataObject {
    const result: IDataObject = {};

    for (const key in obj) {
        if (obj[key] === null) {
            continue; // Skip null values
        }

        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            // Recursively process nested objects
            result[key] = stripNullValues(obj[key] as IDataObject);
        } else {
            // Keep non-null values
            result[key] = obj[key];
        }
    }

    return result;
}

// eslint-disable-next-line @n8n/community-nodes/node-usable-as-tool
export class IvantiNeuronsItsmTrigger implements INodeType {
    usableAsTool = false;
    description: INodeTypeDescription = {
        displayName: 'Ivanti Neurons for ITSM Trigger',
        name: 'ivantiNeuronsItsmTrigger',
        icon: { light: 'file:ivanti.light.svg', dark: 'file:ivanti.dark.svg' },
        group: ['trigger'],
        version: 1,
        subtitle: '={{$parameter["triggerOn"]}}',
        description: 'Starts a workflow when Ivanti Neurons for ITSM objects are created or updated',
        defaults: {
            name: 'Ivanti Neurons for ITSM Trigger',
        },
        polling: true,
        inputs: [],
        outputs: [NodeConnectionTypes.Main],
        credentials: [
            {
                name: 'ivantiNeuronsItsmApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Business Object Name',
                name: 'businessObject',
                type: 'string',
                default: 'Incident',
                description: 'Name of the business object (e.g. Incident, Change). An "s" will be automatically appended to the end (e.g. Incident -> Incidents, Journal__Notes -> Journal__Notess).',
                required: true,
            },
            {
                displayName: 'Trigger On',
                name: 'triggerOn',
                type: 'options',
                required: true,
                default: 'objectCreated',
                options: [
                    {
                        name: 'Object Created',
                        value: 'objectCreated',
                    },
                    {
                        name: 'Object Updated',
                        value: 'objectUpdated',
                    },
                ],
            },
            {
                displayName: 'This trigger also catches newly created objects due to Ivanti timestamp behavior. We recommend using a Filter to exclude unwanted items.',
                name: 'objectUpdatedNotice',
                type: 'notice',
                default: '',
                displayOptions: {
                    show: {
                        triggerOn: ['objectUpdated'],
                    },
                },
            },
            {
                displayName: 'Filter',
                name: 'filter',
                type: 'string',
                default: '',
                description: 'OData filter expression (e.g. Status eq \'Active\'). Recommended to exclude unwanted updates.',
                displayOptions: {
                    show: {
                        triggerOn: ['objectUpdated'],
                    },
                },
            },
            {
                displayName: 'Send Select Parameters',
                name: 'useSelect',
                type: 'boolean',
                default: false,
                description: 'Whether to specify which fields to return',
            },
            {
                displayName: 'Select Mode',
                name: 'selectMode',
                type: 'options',
                options: [
                    {
                        name: 'From List',
                        value: 'list',
                        description: 'Select fields from a dropdown (fetches available fields)',
                    },
                    {
                        name: 'Manual',
                        value: 'manual',
                        description: 'Enter field names manually as comma-separated list',
                    },
                ],
                default: 'manual',
                displayOptions: {
                    show: {
                        useSelect: [true],
                    },
                },
            },
            {
                displayName: 'Select Names or IDs',
                name: 'select',
                type: 'multiOptions',
                typeOptions: {
                    loadOptionsMethod: 'getObjectFields',
                    loadOptionsDependsOn: ['businessObject'],
                },
                default: [],
                description: 'Fields to return in the response. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
                displayOptions: {
                    show: {
                        useSelect: [true],
                        selectMode: ['list'],
                    },
                },
            },
            {
                displayName: 'Select (Manual)',
                name: 'selectManual',
                type: 'string',
                default: '',
                placeholder: 'RecId,Subject,Status',
                description: 'Comma-separated list of fields to return',
                displayOptions: {
                    show: {
                        useSelect: [true],
                        selectMode: ['manual'],
                    },
                },
            },
            {
                displayName: 'Options',
                name: 'options',
                type: 'collection',
                placeholder: 'Add Option',
                default: {},
                options: [
                    {
                        displayName: 'Filter',
                        name: 'filter',
                        type: 'string',
                        default: '',
                        description: 'OData filter expression (e.g. Status eq \'Active\', Owner eq \'$NULL\')',
                        displayOptions: {
                            show: {
                                '/triggerOn': ['objectCreated'],
                            },
                        },
                    },
                    {
                        displayName: 'Strip Null Values',
                        name: 'stripNull',
                        type: 'boolean',
                        default: false,
                        description: 'Whether to remove fields with null values from the output',
                    },
                    {
                        displayName: 'Sort Output Keys',
                        name: 'sortOutput',
                        type: 'boolean',
                        default: true,
                        description: 'Whether to sort the output keys alphabetically',
                    },
                ],
            },
        ],
    };

    methods = {
        loadOptions: {
            getObjectFields,
        },
    };

    async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
        const pollData = this.getWorkflowStaticData('node') as PollData;
        const businessObject = this.getNodeParameter('businessObject') as string;
        const triggerOn = this.getNodeParameter('triggerOn') as string;
        const options = this.getNodeParameter('options', {}) as IDataObject;
        const stripNull = options.stripNull as boolean || false;
        const sortOutput = options.sortOutput !== false; // Default to true

        const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
        const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');
        const objectName = `${businessObject}s`;

        // Determine which field to use for filtering
        const dateField = triggerOn === 'objectCreated' ? 'CreatedDateTime' : 'LastModDateTime';

        // Helper function to convert any timestamp to UTC Z format
        const toUTCZFormat = (timestamp: string): string => {
            return new Date(timestamp).toISOString();
        };

        // Helper function to format item data
        const formatItemData = (item: IDataObject): IDataObject => {
            let formatted = cleanODataResponse(item, sortOutput);
            if (stripNull) {
                formatted = stripNullValues(formatted);
            }
            return formatted;
        };

        // Initialize lastTimeChecked if not set
        if (!pollData.lastTimeChecked) {
            pollData.lastTimeChecked = new Date().toISOString();
        }

        // Ensure lastTimeChecked is in UTC Z format
        const lastTimeCheckedUTC = toUTCZFormat(pollData.lastTimeChecked);

        const qs: IDataObject = {};

        const useSelect = this.getNodeParameter('useSelect', false) as boolean;
        if (useSelect) {
            const selectMode = this.getNodeParameter('selectMode') as string;
            let selectFields: string[] = [];

            if (selectMode === 'list') {
                selectFields = this.getNodeParameter('select') as string[] || [];
            } else {
                const selectManual = this.getNodeParameter('selectManual') as string;
                if (selectManual) {
                    selectFields = selectManual.split(',').map(s => s.trim());
                }
            }

            // Ensure dateField is included
            if (!selectFields.includes(dateField)) {
                selectFields.push(dateField);
            }

            if (selectFields.length > 0) {
                qs['$select'] = selectFields.join(',');
            }
        }

        // Manual mode: fetch the most recent record for testing
        if (this.getMode() === 'manual') {
            qs['$top'] = 1;
            qs['$orderby'] = `${dateField} desc`;

            // Apply user filter if provided
            if (options.filter) {
                qs['$filter'] = options.filter as string;
            }

            try {
                const response = await this.helpers.httpRequestWithAuthentication.call(
                    this,
                    'ivantiNeuronsItsmApi',
                    {
                        method: 'GET',
                        url: `${baseUrl}/api/odata/businessobject/${objectName}`,
                        qs,
                        json: true,
                        skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                    },
                );

                if (response.value && Array.isArray(response.value) && response.value.length > 0) {
                    const formattedItem = formatItemData(response.value[0] as IDataObject);
                    return [this.helpers.returnJsonArray(formattedItem)];
                }

                throw new NodeOperationError(
                    this.getNode(),
                    'No data with the current filter could be found',
                );
            } catch (error) {
                throw new NodeOperationError(this.getNode(), error as Error);
            }
        }

        // Polling mode: fetch records created/updated since last check
        const filterParts: string[] = [];

        // Add date filter with UTC Z format timestamp
        filterParts.push(`${dateField} gt ${lastTimeCheckedUTC}`);

        // Add user filter if provided
        let filter = '';
        if (triggerOn === 'objectUpdated') {
            filter = this.getNodeParameter('filter', '') as string;
        } else {
            filter = options.filter as string || '';
        }

        if (filter) {
            filterParts.push(`(${filter})`);
        }

        qs['$filter'] = filterParts.join(' and ');
        qs['$orderby'] = `${dateField} asc`;

        try {
            const response = await this.helpers.httpRequestWithAuthentication.call(
                this,
                'ivantiNeuronsItsmApi',
                {
                    method: 'GET',
                    url: `${baseUrl}/api/odata/businessobject/${objectName}`,
                    qs,
                    json: true,
                    skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                },
            );

            const returnData: IDataObject[] = [];

            if (response.value && Array.isArray(response.value) && response.value.length > 0) {
                // Format each item with cleanODataResponse and optional stripNull
                (response.value as IDataObject[]).forEach((item) => {
                    returnData.push(formatItemData(item));
                });

                // Update lastTimeChecked to the date of the last processed item (convert to UTC Z)
                const lastItem = response.value[response.value.length - 1] as IDataObject;
                if (lastItem[dateField]) {
                    pollData.lastTimeChecked = toUTCZFormat(lastItem[dateField] as string);
                }
            }

            if (returnData.length > 0) {
                return [this.helpers.returnJsonArray(returnData)];
            }

            return null;
        } catch (error) {
            throw new NodeOperationError(this.getNode(), error as Error);
        }
    }
}
