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
                resource: ['attachment'],
                operation: ['get'],
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
            const recId = this.getNodeParameter('recId', i) as string;
            const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
            const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

            const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                method: 'GET',
                url: `${baseUrl}/api/rest/Attachment`,
                qs: {
                    ID: recId,
                },
                encoding: 'arraybuffer',
                returnFullResponse: true,
                skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
            });

            // @ts-expect-error - response.body can be ArrayBuffer or Buffer
            let data: Buffer;
            if (response.body instanceof ArrayBuffer) {
                // @ts-expect-error - Buffer.from accepts ArrayBuffer
                data = Buffer.from(response.body);
                // @ts-expect-error - Buffer check needed for type narrowing
            } else if (Buffer.isBuffer(response.body)) {
                data = response.body;
            } else {
                throw new Error('Unexpected response format for attachment data');
            }

            const headers = response.headers || {};

            let fileName = `attachment_${recId}`;
            if (headers['content-disposition']) {
                const contentDisposition = headers['content-disposition'] as string;
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) {
                    fileName = match[1];
                }
            }

            const newItem: INodeExecutionData = {
                json: { attachmentId: recId },
                binary: {
                    data: {
                        data: data.toString('base64'),
                        mimeType: (headers['content-type'] as string) || 'application/octet-stream',
                        fileName,
                    },
                },
            };
            returnData.push(newItem);

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
