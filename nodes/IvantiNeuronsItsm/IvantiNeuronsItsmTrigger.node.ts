import type {
    IDataObject,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IPollFunctions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { cleanODataResponse } from './methods/helpers';

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

export class IvantiNeuronsItsmTrigger implements INodeType {
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
                    },
                    {
                        displayName: 'Strip Null Values',
                        name: 'stripNull',
                        type: 'boolean',
                        default: false,
                        description: 'Whether to remove fields with null values from the output',
                    },
                ],
            },
        ],
    };

    async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
        const pollData = this.getWorkflowStaticData('node') as PollData;
        const businessObject = this.getNodeParameter('businessObject') as string;
        const triggerOn = this.getNodeParameter('triggerOn') as string;
        const options = this.getNodeParameter('options', {}) as IDataObject;
        const stripNull = options.stripNull as boolean || false;

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
            let formatted = cleanODataResponse(item);
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
        if (options.filter) {
            filterParts.push(`(${options.filter})`);
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
