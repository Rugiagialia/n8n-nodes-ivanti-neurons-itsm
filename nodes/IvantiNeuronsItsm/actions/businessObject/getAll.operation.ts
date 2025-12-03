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
        displayName: 'Return All',
        name: 'returnAll',
        type: 'boolean',
        default: false,
        description: 'Whether to return all results or only up to a given limit',
        displayOptions: {
            show: {
                resource: ['businessObject'],
                operation: ['getAll'],
            },
        },
    },
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 50,
        description: 'Max number of results to return',
        typeOptions: {
            minValue: 1,
        },
        displayOptions: {
            show: {
                resource: ['businessObject'],
                operation: ['getAll'],
                returnAll: [false],
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
                resource: ['businessObject'],
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
                resource: ['businessObject'],
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
            loadOptionsDependsOn: ['businessObject'],
        },
        default: [],
        description: 'Fields to return in the response. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
        displayOptions: {
            show: {
                resource: ['businessObject'],
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
        placeholder: 'RecId,Subject,Status',
        description: 'Comma-separated list of fields to return',
        displayOptions: {
            show: {
                resource: ['businessObject'],
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
                resource: ['businessObject'],
                operation: ['getAll'],
            },
        },
    },
    {
        displayName: 'Order By Field',
        name: 'orderByField',
        type: 'string',
        default: '',
        placeholder: 'CreatedDateTime',
        description: 'Field to sort by',
        displayOptions: {
            show: {
                resource: ['businessObject'],
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
                resource: ['businessObject'],
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
                resource: ['businessObject'],
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
                description: 'OData filter expression (e.g. Status eq \'Active\', Owner eq \'$NULL\')',
            },
            {
                displayName: 'Pagination',
                name: 'pagination',
                placeholder: 'Add Pagination',
                type: 'fixedCollection',
                typeOptions: {
                    multipleValues: false,
                },
                default: {
                    pagination: {},
                },
                options: [
                    {
                        displayName: 'Pagination',
                        name: 'pagination',
                        values: [
                            {
                                displayName: 'Pages per Batch',
                                name: 'pagesPerBatch',
                                type: 'number',
                                typeOptions: {
                                    minValue: -1,
                                },
                                default: 10,
                                description: 'Number of pages to fetch before pausing. -1 to disable delays.',
                            },
                            {
                                // eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
                                displayName: 'Pagination Interval (ms)',
                                name: 'paginationInterval',
                                type: 'number',
                                typeOptions: {
                                    minValue: 0,
                                },
                                default: 100,
                                description: 'Time (in milliseconds) between each batch of page requests. 0 for disabled.',
                            },
                        ],
                    },
                ],
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

    // Get batching options (outer loop - throttling incoming items)
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
        // Apply item batching delay (outer loop - throttling incoming items)
        if (i > 0 && batchSize >= 0 && batchInterval > 0) {
            if (i % batchSize === 0) {
                await sleep(batchInterval);
            }
        }

        try {
            const businessObject = this.getNodeParameter('businessObject', i) as string;
            const objectName = `${businessObject}s`;
            const returnAll = this.getNodeParameter('returnAll', i) as boolean;
            const options = this.getNodeParameter('options', i) as IDataObject;
            const sortOutput = options.sortOutput !== false;
            const useSelect = this.getNodeParameter('useSelect', i) as boolean;
            const useSort = this.getNodeParameter('useSort', i) as boolean;

            const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
            const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

            const qs: IDataObject = {};

            if (options.filter) {
                qs['$filter'] = options.filter as string;
            }

            // Handle select based on mode - only if useSelect is enabled
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

            // Handle sort - only if useSort is enabled
            if (useSort) {
                const orderByField = this.getNodeParameter('orderByField', i) as string;
                if (orderByField) {
                    const orderDirection = this.getNodeParameter('orderDirection', i) as string;
                    qs['$orderby'] = `${orderByField} ${orderDirection}`;

                    // Ensure the orderByField is included in the select list if select is used
                    if (qs['$select']) {
                        const selectFields = (qs['$select'] as string).split(',').map(s => s.trim());
                        if (!selectFields.includes(orderByField)) {
                            qs['$select'] += `,${orderByField}`;
                        }
                    }
                }
            }

            if (returnAll) {
                let allItems: IDataObject[] = [];
                let skip = 0;
                const top = 100; // Batch size
                let hasMore = true;
                let pageCount = 0;

                const paginationOptions = (options.pagination as IDataObject)?.pagination as IDataObject | undefined;
                let pagesPerBatch = -1;
                let paginationInterval = 0;

                if (paginationOptions) {
                    pagesPerBatch = paginationOptions.pagesPerBatch !== undefined ? (paginationOptions.pagesPerBatch as number) : 10;
                    paginationInterval = paginationOptions.paginationInterval !== undefined ? (paginationOptions.paginationInterval as number) : 100;
                }
                const shouldDelayPagination = pagesPerBatch !== -1 && paginationInterval > 0;

                while (hasMore) {
                    const requestQs = { ...qs };
                    requestQs['$skip'] = skip;
                    requestQs['$top'] = top;

                    const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                        method: 'GET',
                        url: `${baseUrl}/api/odata/businessobject/${objectName}`,
                        qs: requestQs,
                        json: true,
                        skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                    });

                    if (response.value && Array.isArray(response.value)) {
                        allItems = allItems.concat(response.value as IDataObject[]);
                        pageCount++;

                        if (response.value.length < top) {
                            hasMore = false;
                        } else {
                            skip += top;

                            // Add delay after each batch of pages
                            if (shouldDelayPagination && pageCount % pagesPerBatch === 0 && hasMore) {
                                await sleep(paginationInterval);
                            }
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
            } else {
                const limit = this.getNodeParameter('limit', i) as number;

                // Ivanti API supports max 100 records per request, so use pagination if limit > 100
                if (limit <= 100) {
                    qs['$top'] = limit;
                    const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                        method: 'GET',
                        url: `${baseUrl}/api/odata/businessobject/${objectName}`,
                        qs,
                        json: true,
                        skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                    });

                    if (response.value && Array.isArray(response.value)) {
                        (response.value as IDataObject[]).forEach((item) => returnData.push({
                            json: cleanODataResponse(item, sortOutput),
                            pairedItem: { item: i },
                        }));
                    }
                } else {
                    let allItems: IDataObject[] = [];
                    let skip = 0;
                    const top = 100;
                    let remaining = limit;
                    let pageCount = 0;

                    const paginationOptions = (options.pagination as IDataObject)?.pagination as IDataObject | undefined;
                    let pagesPerBatch = -1;
                    let paginationInterval = 0;

                    if (paginationOptions) {
                        pagesPerBatch = paginationOptions.pagesPerBatch !== undefined ? (paginationOptions.pagesPerBatch as number) : 10;
                        paginationInterval = paginationOptions.paginationInterval !== undefined ? (paginationOptions.paginationInterval as number) : 100;
                    }
                    const shouldDelayPagination = pagesPerBatch !== -1 && paginationInterval > 0;

                    while (remaining > 0) {
                        const requestQs = { ...qs };
                        requestQs['$skip'] = skip;
                        requestQs['$top'] = Math.min(top, remaining);

                        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                            method: 'GET',
                            url: `${baseUrl}/api/odata/businessobject/${objectName}`,
                            qs: requestQs,
                            json: true,
                            skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                        });

                        if (response.value && Array.isArray(response.value)) {
                            allItems = allItems.concat(response.value as IDataObject[]);
                            remaining -= response.value.length;
                            pageCount++;

                            if (response.value.length < (requestQs['$top'] as number)) {
                                break;
                            }
                            skip += response.value.length;

                            if (shouldDelayPagination && pageCount % pagesPerBatch === 0 && remaining > 0) {
                                await sleep(paginationInterval);
                            }
                        } else {
                            break;
                        }
                    }

                    allItems.forEach((item) => returnData.push({
                        json: cleanODataResponse(item, sortOutput),
                        pairedItem: { item: i },
                    }));
                }
            }

        } catch (error) {
            const { message, description } = getIvantiErrorDetails(error);

            if (this.continueOnFail()) {
                returnData.push({
                    json: {
                        error: message,
                        details: description
                    }
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
