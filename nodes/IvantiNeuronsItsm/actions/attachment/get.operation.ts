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
                displayName: 'Batch Interval (Ms)',
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
];

export async function execute(
    this: IExecuteFunctions,
    items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];
    const options = this.getNodeParameter('options', 0, {}) as IDataObject;
    const batchSize = (options.batchSize as number) !== undefined ? (options.batchSize as number) : -1;
    const batchInterval = (options.batchInterval as number) !== undefined ? (options.batchInterval as number) : 1000;

    const effectiveBatchSize = batchSize !== -1 ? Math.max(1, batchSize) : items.length;

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

            // Extract binary data - response.body contains the arraybuffer
            // @ts-ignore
            let data: Buffer;
            if (response.body instanceof ArrayBuffer) {
                // @ts-ignore
                data = Buffer.from(response.body);
                // @ts-ignore
            } else if (Buffer.isBuffer(response.body)) {
                data = response.body;
            } else {
                throw new Error('Unexpected response format for attachment data');
            }

            const headers = response.headers || {};

            let fileName = `attachment_${recId}`;
            if (headers['content-disposition']) {
                const contentDisposition = headers['content-disposition'] as string;
                const match = contentDisposition.match(/filename=\"?([^\"]+)\"?/);
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

        if (batchSize !== -1 && batchInterval > 0 && (i + 1) % effectiveBatchSize === 0 && (i + 1) < items.length) {
            await sleep(batchInterval);
        }
    }

    return returnData;
}
