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
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
            show: {
                resource: ['relationship'],
                operation: ['getRelated'],
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
            const businessObject = this.getNodeParameter('businessObject', i) as string;
            const objectName = `${businessObject}s`;
            const recId = this.getNodeParameter('recId', i) as string;
            const relationshipName = this.getNodeParameter('relationshipName', i) as string;

            const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
            const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

            const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                method: 'GET',
                url: `${baseUrl}/api/odata/businessobject/${objectName}('${recId}')/${relationshipName}`,
                json: true,
                skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
            });

            if (response.value && Array.isArray(response.value)) {
                const relatedItems = response.value.map((item: IDataObject) => ({
                    json: cleanODataResponse(item),
                    pairedItem: {
                        item: i,
                    },
                }));
                returnData.push(...relatedItems);
            } else {
                returnData.push({
                    json: cleanODataResponse(response),
                    pairedItem: {
                        item: i,
                    },
                });
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

        if (batchSize !== -1 && batchInterval > 0 && (i + 1) % effectiveBatchSize === 0 && (i + 1) < items.length) {
            await sleep(batchInterval);
        }
    }

    return returnData;
}
