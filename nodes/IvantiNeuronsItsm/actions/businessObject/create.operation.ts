import {
    IExecuteFunctions,
    IDataObject,
    INodeExecutionData,
    INodeProperties,
    NodeApiError,
    JsonObject,
} from 'n8n-workflow';
import { cleanODataResponse, sleep, getIvantiErrorDetails } from '../../methods/helpers';
import { processAssignments } from '../../methods/validation';

export const properties: INodeProperties[] = [
    {
        displayName: 'Mode',
        name: 'mode',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['businessObject'],
                operation: ['create'],
            },
        },
        options: [
            {
                name: 'Manual Mapping',
                value: 'manual',
                description: 'Edit item fields one by one',
                action: 'Edit item fields one by one',
            },
            {
                name: 'JSON',
                value: 'json',
                description: 'Customize item output with JSON',
                action: 'Customize item output with JSON',
            },
        ],
        default: 'manual',
    },
    {
        displayName: 'Fields to Set',
        name: 'assignments',
        type: 'assignmentCollection',
        default: {},
        description: 'Note: Ivanti only supports String, Number, and Boolean field types. Array, Object, and Binary types will be rejected by the API.',
        displayOptions: {
            show: {
                resource: ['businessObject'],
                operation: ['create'],
                mode: ['manual'],
            },
        },
    },
    {
        displayName: 'JSON',
        name: 'body',
        type: 'json',
        default: '{\n  "field_name": "value"\n}',
        description: 'Fields to send in the request body',
        displayOptions: {
            show: {
                resource: ['businessObject'],
                operation: ['create'],
                mode: ['json'],
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
                operation: ['create'],
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
                displayName: 'Ignore Type Conversion Errors',
                name: 'ignoreConversionErrors',
                type: 'boolean',
                default: false,
                description: 'Whether to ignore field type errors and apply a less strict type conversion',
                displayOptions: {
                    show: {
                        '/operation': ['create'],
                        '/mode': ['manual'],
                    },
                },
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
            const mode = this.getNodeParameter('mode', i) as string;
            let body: IDataObject = {};

            if (mode === 'json') {
                body = this.getNodeParameter('body', i) as IDataObject;
                if (typeof body === 'string') {
                    try {
                        body = JSON.parse(body);
                    } catch {
                        throw new Error('Invalid JSON in "JSON" parameter');
                    }
                }
            } else {
                const assignmentsData = this.getNodeParameter('assignments', i) as { assignments: Array<{ name: string; value: string | number; type?: string }> };
                const ignoreConversionErrors = options.ignoreConversionErrors as boolean;

                if (assignmentsData && assignmentsData.assignments) {
                    body = processAssignments(
                        assignmentsData.assignments,
                        this.getNode(),
                        i,
                        ignoreConversionErrors,
                    );
                }
            }

            const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
            const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');
            const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                method: 'POST',
                url: `${baseUrl}/api/odata/businessobject/${objectName}`,
                body,
                json: true,
                skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
            });
            returnData.push({ json: cleanODataResponse(response) });

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
