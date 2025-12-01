import {
    IExecuteFunctions,
    IDataObject,
    INodeExecutionData,
    INodeProperties,
    NodeApiError,
    JsonObject,
} from 'n8n-workflow';
import FormData from 'form-data';
import { getIvantiErrorDetails, sleep } from '../../methods/helpers';

export const properties: INodeProperties[] = [
    {
        displayName: 'Business Object Name',
        name: 'businessObject',
        type: 'string',
        default: 'Incident',
        description: 'Name of the business object (e.g. Incident, Change). An "s" will be automatically appended to the end (e.g. Incident -> Incidents, Journal__Notes -> Journal__Notess).',
        required: true,
        displayOptions: {
            show: {
                resource: ['attachment'],
                operation: ['upload'],
            },
        },
    },
    {
        displayName: 'Record ID',
        name: 'recId',
        type: 'string',
        default: '',
        description: 'The unique identifier of the business object to attach to',
        required: true,
        displayOptions: {
            show: {
                resource: ['attachment'],
                operation: ['upload'],
            },
        },
    },
    {
        displayName: 'Input Binary Field',
        name: 'binaryPropertyName',
        type: 'string',
        default: 'data',
        description: 'The name of the binary property which contains the data for the file to be uploaded',
        required: true,
        displayOptions: {
            show: {
                resource: ['attachment'],
                operation: ['upload'],
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
                resource: ['attachment'],
                operation: ['upload'],
            },
        },
        options: [
            {
                displayName: 'File Name',
                name: 'fileName',
                type: 'string',
                default: '',
                placeholder: 'Leave empty to use original filename',
                description: 'Name for the uploaded file. If not specified, uses the original filename from the binary data.',
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

    for (let i = 0; i < items.length; i++) {
        try {
            const businessObject = this.getNodeParameter('businessObject', i) as string;
            const recId = this.getNodeParameter('recId', i) as string;
            const options = this.getNodeParameter('options', i, {}) as IDataObject;
            const userFileName = options.fileName as string || '';

            const batching = (options.batching as IDataObject)?.batch as IDataObject | undefined;
            let batchSize = -1;
            let batchInterval = 0;

            if (batching) {
                batchSize = (batching.batchSize as number);
                if (batchSize === 0) batchSize = 1;
                batchInterval = (batching.batchInterval as number);
            }
            const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
            const item = items[i];

            if (item.binary === undefined) {
                throw new Error('No binary data exists on item!');
            }

            const binaryData = item.binary[binaryPropertyName];
            if (binaryData === undefined) {
                throw new Error(`No binary data property '${binaryPropertyName}' does not exist on item!`);
            }

            // Get credentials for authentication header
            const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
            const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

            // Use provided fileName or default to original filename from binary data
            const fileName = userFileName || binaryData.fileName || 'file';

            // Prepare file buffer from base64 binary data
            // @ts-expect-error - Buffer.from is available in Node.js
            const fileBuffer = Buffer.from(binaryData.data, 'base64');

            // Use FormData from form-data package (same as n8n HTTP Request node)
            const form = new FormData();

            form.append('AttachmentType', 'File');
            form.append('file', fileBuffer, {
                filename: fileName,
                contentType: binaryData.mimeType || 'application/octet-stream',
            });

            // Append required fields per Ivanti API spec
            form.append('ObjectID', recId);
            form.append('ObjectType', businessObject.toLowerCase() + '#');

            const response = await this.helpers.httpRequest({
                method: 'POST',
                url: `${baseUrl}/api/rest/Attachment`,
                body: form,
                headers: {
                    'Authorization': `rest_api_key=${credentials.apiKey}`,
                },
                returnFullResponse: true,
                skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
            });

            // Parse response - Ivanti returns array of upload results
            const responseBody = response.body || [];
            if (Array.isArray(responseBody) && responseBody.length > 0) {
                const uploadResult = responseBody[0];
                returnData.push({
                    json: {
                        success: uploadResult.IsUploaded || false,
                        fileName: uploadResult.FileName,
                        attachmentId: uploadResult.Message,
                        message: uploadResult.IsUploaded ? 'File uploaded successfully' : uploadResult.Message,
                    }
                });
            } else {
                returnData.push({ json: { success: false, message: 'Unexpected response format', response: responseBody } });
            }

            // Apply batching delay before processing next item (HTTP Request node pattern)
            if (i > 0 && batchSize >= 0 && batchInterval > 0) {
                if (i % batchSize === 0) {
                    await sleep(batchInterval);
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


