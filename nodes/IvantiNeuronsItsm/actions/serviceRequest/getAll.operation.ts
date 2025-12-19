import {
    IExecuteFunctions,
    IDataObject,
    INodeExecutionData,
    INodeProperties,
    NodeApiError,
    JsonObject,
} from 'n8n-workflow';
import { cleanODataResponse, sleep, getIvantiErrorDetails } from '../../methods/helpers';

export const properties: INodeProperties[] = [
    {
        displayName: 'Record ID',
        name: 'recId',
        type: 'string',
        default: '',
        description: 'The unique identifier of the Service Request',
        required: true,
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['getAll'],
            },
        },
    },
    {
        displayName: 'Note: This operation only retrieves the submitted parameters for the Service Request. To get general information about the Service Request itself, use the "Business Object" resource with the "Get" operation.',
        name: 'notice',
        type: 'notice',
        default: '',
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['getAll'],
            },
        },
    },
    {
        displayName: 'Send Select Parameters',
        name: 'useSelect',
        type: 'boolean',
        default: false,
        description: 'Whether to specify which fields to return',
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['getAll'],
            },
        },
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
                resource: ['serviceRequest'],
                operation: ['getAll'],
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
            loadOptionsParameters: {
                businessObject: 'ServiceReqParam',
            },
        },
        default: [],
        description: 'Fields to return in the response. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['getAll'],
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
        placeholder: 'RecId,ParameterName,ParameterValue',
        description: 'Comma-separated list of fields to return',
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['getAll'],
                useSelect: [true],
                selectMode: ['manual'],
            },
        },
    },
    {
        displayName: 'Send Sort Parameters',
        name: 'useSort',
        type: 'boolean',
        default: false,
        description: 'Whether to sort the results',
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['getAll'],
            },
        },
    },
    {
        displayName: 'Order By Field',
        name: 'orderByField',
        type: 'string',
        default: 'CreatedDateTime',
        placeholder: 'CreatedDateTime',
        description: 'Field to sort by',
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['getAll'],
                useSort: [true],
            },
        },
    },
    {
        displayName: 'Order Direction',
        name: 'orderDirection',
        type: 'options',
        options: [
            {
                name: 'Ascending',
                value: 'asc',
            },
            {
                name: 'Descending',
                value: 'desc',
            },
        ],
        default: 'asc',
        description: 'Sort order direction',
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['getAll'],
                useSort: [true],
            },
        },
    },
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['getAll'],
            },
        },
        options: [
            {
                displayName: 'Batching',
                name: 'batching',
                placeholder: 'Add Batching',
                type: 'fixedCollection',
                typeOptions: {
                    multipleValues: false,
                },
                default: {
                    batch: {},
                },
                options: [
                    {
                        displayName: 'Batching',
                        name: 'batch',
                        values: [
                            {
                                displayName: 'Items per Batch',
                                name: 'batchSize',
                                type: 'number',
                                typeOptions: {
                                    minValue: -1,
                                },
                                default: 50,
                                description: 'Input will be split in batches to throttle requests. -1 for disabled. 0 will be treated as 1.',
                            },
                            {
                                // eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
                                displayName: 'Batch Interval (ms)',
                                name: 'batchInterval',
                                type: 'number',
                                typeOptions: {
                                    minValue: 0,
                                },
                                default: 1000,
                                description: 'Time (in milliseconds) between each batch of requests. 0 for disabled.',
                            },
                        ],
                    },
                ],
            },
            {
                displayName: 'Filter',
                name: 'filter',
                type: 'string',
                default: '',
                description: 'OData filter expression (e.g. ParameterValue ne null, ParameterName eq \'Subject\')',
            },
            {
                displayName: 'Sort Output Keys',
                name: 'sortOutput',
                type: 'boolean',
                default: true,
                description: 'Whether to sort the output keys alphabetically',
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
];

export async function execute(
    this: IExecuteFunctions,
    items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];

    const options = this.getNodeParameter('options', 0, {}) as IDataObject;
    const batching = (options.batching as IDataObject)?.batch as IDataObject | undefined;
    let batchSize = -1;
    let batchInterval = 0;

    if (batching) {
        batchSize = (batching.batchSize as number);
        if (batchSize === 0) batchSize = 1;
        batchInterval = (batching.batchInterval as number);
    }

    for (let i = 0; i < items.length; i++) {
        if (i > 0 && batchSize >= 0 && batchInterval > 0) {
            if (i % batchSize === 0) {
                await sleep(batchInterval);
            }
        }

        try {
            const recId = this.getNodeParameter('recId', i) as string;
            const useSelect = this.getNodeParameter('useSelect', i) as boolean;
            const useSort = this.getNodeParameter('useSort', i) as boolean;
            const itemOptions = this.getNodeParameter('options', i, {}) as IDataObject;
            const sortOutput = itemOptions.sortOutput !== false;

            const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
            const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

            const qs: IDataObject = {};
            let filter = `ParentLink_RecID eq '${recId}'`;

            if (itemOptions.filter) {
                filter = `(${filter}) and (${itemOptions.filter})`;
            }

            qs['$filter'] = filter;

            if (useSelect) {
                const selectMode = this.getNodeParameter('selectMode', i) as string;
                if (selectMode === 'list') {
                    const select = this.getNodeParameter('select', i) as string[];
                    if (select && select.length > 0) {
                        qs['$select'] = select.join(',');
                    }
                } else {
                    const selectManual = this.getNodeParameter('selectManual', i) as string;
                    if (selectManual) {
                        qs['$select'] = selectManual;
                    }
                }
            }

            if (useSort) {
                const orderByField = this.getNodeParameter('orderByField', i) as string;
                if (orderByField) {
                    const orderDirection = this.getNodeParameter('orderDirection', i) as string;
                    qs['$orderby'] = `${orderByField} ${orderDirection}`;

                    if (qs['$select']) {
                        const selectFields = (qs['$select'] as string).split(',').map(s => s.trim());
                        if (!selectFields.includes(orderByField)) {
                            qs['$select'] += `,${orderByField}`;
                        }
                    }
                }
            }

            let allItems: IDataObject[] = [];
            let skip = 0;
            const top = 100;
            let hasMore = true;

            while (hasMore) {
                const requestQs = { ...qs, $skip: skip, $top: top };

                const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                    method: 'GET',
                    url: `${baseUrl}/api/odata/businessobject/ServiceReqParams`,
                    qs: requestQs,
                    json: true,
                    skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                });

                if (response.value && Array.isArray(response.value)) {
                    allItems = allItems.concat(response.value as IDataObject[]);
                    if (response.value.length < top) {
                        hasMore = false;
                    } else {
                        skip += top;
                    }
                } else {
                    hasMore = false;
                }
            }

            allItems.forEach((item) => returnData.push({
                json: cleanODataResponse(item, sortOutput),
                pairedItem: {
                    item: i,
                },
            }));

        } catch (error) {
            const { message, description } = getIvantiErrorDetails(error);

            if (this.continueOnFail()) {
                returnData.push({
                    json: {
                        error: message,
                        details: description,
                    },
                    pairedItem: {
                        item: i,
                    },
                });
                continue;
            }
            throw new NodeApiError(this.getNode(), error as JsonObject, {
                message,
                description: Array.isArray(description) ? description.join('\n') : description,
            });
        }
    }

    return returnData;
}
