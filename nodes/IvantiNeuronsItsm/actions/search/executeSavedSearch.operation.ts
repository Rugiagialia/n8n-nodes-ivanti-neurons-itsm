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
        displayName: 'Saved Search Name or ID',
        name: 'savedSearchId',
        type: 'options',
        typeOptions: {
            loadOptionsMethod: 'getSavedSearches',
            loadOptionsDependsOn: ['businessObject'],
        },
        default: '',
        required: true,
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['executeSavedSearch'],
            },
        },
        description: 'Select a saved search to execute. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    },
    {
        displayName: 'Return All',
        name: 'returnAll',
        type: 'boolean',
        default: false,
        description: 'Whether to return all results or only up to a given limit',
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['executeSavedSearch'],
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
                resource: ['search'],
                operation: ['executeSavedSearch'],
                returnAll: [false],
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
                resource: ['search'],
                operation: ['executeSavedSearch'],
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
                resource: ['search'],
                operation: ['executeSavedSearch'],
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
                resource: ['search'],
                operation: ['executeSavedSearch'],
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
                resource: ['search'],
                operation: ['executeSavedSearch'],
            },
        },
        options: [
            {
                displayName: 'Strip Null Values',
                name: 'stripNull',
                type: 'boolean',
                default: false,
                description: 'Whether to remove fields with null values from the output',
            },
            {
                displayName: 'Filter',
                name: 'filter',
                type: 'string',
                default: '',
                description: 'OData filter expression (e.g. Status eq \'Active\', Owner eq \'$NULL\')',
            },
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
                displayName: 'Pagination Interval (Ms)',
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
];

export async function execute(
    this: IExecuteFunctions,
    items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            const businessObject = this.getNodeParameter('businessObject', i) as string;
            const objectName = `${businessObject}s`;
            const savedSearchId = this.getNodeParameter('savedSearchId', i) as string;
            const [savedSearchName, actionId] = savedSearchId.split('|');
            const returnAll = this.getNodeParameter('returnAll', i) as boolean;
            const options = this.getNodeParameter('options', i) as IDataObject;
            const useSort = this.getNodeParameter('useSort', i) as boolean;

            const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
            const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

            const url = `${baseUrl}/api/odata/businessobject/${objectName}/${savedSearchName}`;
            const qs: IDataObject = { ActionId: actionId };

            if (options.filter) {
                qs['$filter'] = options.filter as string;
            }

            // Handle sort - only if useSort is enabled
            if (useSort) {
                const orderByField = this.getNodeParameter('orderByField', i) as string;
                if (orderByField) {
                    const orderDirection = this.getNodeParameter('orderDirection', i) as string;
                    qs['$orderby'] = `${orderByField} ${orderDirection}`;
                }
            }

            // Pagination Logic
            if (returnAll) {
                let allItems: IDataObject[] = [];
                let skip = 0;
                const top = 100; // Batch size
                let hasMore = true;
                let pageCount = 0;

                const pagesPerBatch = (options.pagesPerBatch as number) !== undefined ? (options.pagesPerBatch as number) : 10;
                const paginationInterval = (options.paginationInterval as number) !== undefined ? (options.paginationInterval as number) : 100;
                const shouldDelayPagination = pagesPerBatch !== -1 && paginationInterval > 0;

                while (hasMore) {
                    const requestQs = { ...qs };
                    requestQs['$skip'] = skip;
                    requestQs['$top'] = top;

                    const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                        method: 'GET',
                        url,
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
                            if (shouldDelayPagination && pageCount % pagesPerBatch === 0 && hasMore) {
                                await sleep(paginationInterval);
                            }
                        }
                    } else {
                        hasMore = false;
                    }
                }

                if (allItems.length > 0) {
                    allItems.forEach((item) => returnData.push({
                        json: cleanODataResponse(item),
                        pairedItem: { item: i },
                    }));
                }
            } else {
                const limit = this.getNodeParameter('limit', i) as number;

                if (limit <= 100) {
                    qs['$top'] = limit;
                    const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                        method: 'GET',
                        url,
                        qs,
                        json: true,
                        skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                    });

                    if (response.value && Array.isArray(response.value)) {
                        (response.value as IDataObject[]).forEach((item) => returnData.push({
                            json: cleanODataResponse(item),
                            pairedItem: { item: i },
                        }));
                    } else if (response && Object.keys(response).length > 0 && response.value !== undefined) {
                        // Only push if response is not empty and not just metadata
                        returnData.push({
                            json: cleanODataResponse(response),
                            pairedItem: { item: i },
                        });
                    }
                } else {
                    let allItems: IDataObject[] = [];
                    let skip = 0;
                    const top = 100;
                    let remaining = limit;
                    let pageCount = 0;

                    const pagesPerBatch = (options.pagesPerBatch as number) !== undefined ? (options.pagesPerBatch as number) : 10;
                    const paginationInterval = (options.paginationInterval as number) !== undefined ? (options.paginationInterval as number) : 100;
                    const shouldDelayPagination = pagesPerBatch !== -1 && paginationInterval > 0;

                    while (remaining > 0) {
                        const requestQs = { ...qs };
                        requestQs['$skip'] = skip;
                        requestQs['$top'] = Math.min(top, remaining);

                        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                            method: 'GET',
                            url,
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

                    if (allItems.length > 0) {
                        allItems.forEach((item) => returnData.push({
                            json: cleanODataResponse(item),
                            pairedItem: { item: i },
                        }));
                    }
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
