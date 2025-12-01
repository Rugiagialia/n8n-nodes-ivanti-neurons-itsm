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
        displayName: 'Send Select Parameters',
        name: 'useSelect',
        type: 'boolean',
        default: false,
        description: 'Whether to specify which fields to return',
        displayOptions: {
            show: {
                resource: ['businessObject'],
                operation: ['get'],
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
                operation: ['get'],
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
                operation: ['get'],
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
                operation: ['get'],
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
        displayOptions: {
            show: {
                resource: ['businessObject'],
                operation: ['get'],
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
        try {
            const businessObject = this.getNodeParameter('businessObject', i) as string;
            const objectName = `${businessObject}s`;
            const recId = this.getNodeParameter('recId', i) as string;
            const useSelect = this.getNodeParameter('useSelect', i) as boolean;

            const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
            const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

            const qs: IDataObject = {};

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

                qs['$filter'] = `RecId eq '${recId}'`;

                const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                    method: 'GET',
                    url: `${baseUrl}/api/odata/businessobject/${objectName}`,
                    qs,
                    json: true,
                    skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                });

                if (response.value && Array.isArray(response.value) && response.value.length > 0) {
                    returnData.push({ json: cleanODataResponse(response.value[0]) as IDataObject });
                } else {
                    throw new Error(`Item with ID '${recId}' not found.`);
                }
            } else {
                const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                    method: 'GET',
                    url: `${baseUrl}/api/odata/businessobject/${objectName}('${recId}')`,
                    qs,
                    json: true,
                    skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                });
                returnData.push({ json: cleanODataResponse(response) });
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

        // Apply batching delay before processing (HTTP Request node pattern)
        if (i > 0 && batchSize >= 0 && batchInterval > 0) {
            if (i % batchSize === 0) {
                await sleep(batchInterval);
            }
        }
    }

    return returnData;
}
