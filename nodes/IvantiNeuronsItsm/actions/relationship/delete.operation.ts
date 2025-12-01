import {
    IExecuteFunctions,
    IDataObject,
    INodeExecutionData,
    INodeProperties,
    NodeApiError,
    JsonObject,
} from 'n8n-workflow';
import { sleep, getIvantiErrorDetails } from '../../methods/helpers';

export const properties: INodeProperties[] = [
    {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
            show: {
                resource: ['relationship'],
                operation: ['delete'],
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
            const relationshipName = this.getNodeParameter('relationshipName', i) as string;
            const relatedRecId = this.getNodeParameter('relatedRecId', i) as string;

            const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
            const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

            await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                method: 'DELETE',
                url: `${baseUrl}/api/odata/businessobject/${objectName}('${recId}')/${relationshipName}('${relatedRecId}')/$Ref`,
                json: true,
                skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
            });
            returnData.push({ json: { success: true, message: 'Successfully deleted the link', recId, relatedRecId } });

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
