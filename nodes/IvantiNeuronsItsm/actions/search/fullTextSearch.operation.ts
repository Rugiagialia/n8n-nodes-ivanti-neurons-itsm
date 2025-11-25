import {
    IExecuteFunctions,
    IDataObject,
    INodeExecutionData,
    INodeProperties,
    NodeApiError,
    JsonObject,
} from 'n8n-workflow';
import { getIvantiErrorDetails } from '../../methods/helpers';

export const properties: INodeProperties[] = [
    {
        displayName: 'Search Text',
        name: 'searchText',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['fullTextSearch'],
            },
        },
        description: 'The text to search for',
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
                operation: ['fullTextSearch'],
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
                operation: ['fullTextSearch'],
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
            const searchText = this.getNodeParameter('searchText', i) as string;
            const limit = this.getNodeParameter('limit', i) as number;

            const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
            const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

            let allItems: IDataObject[] = [];
            let skip = 0;
            // API documentation example used Top: 20. Let's assume we can go higher or iterate.
            // We will use 100 as safe batch size if allowed, or stick to 20 if API is strict.
            // Documentation doesn't explicitly say max, but 100 is standard. Let's use 20 to be safe as per example.
            const batchSize = 20;
            let remaining = limit;

            while (remaining > 0) {
                const currentTop = Math.min(batchSize, remaining);
                const body = {
                    Text: searchText,
                    ObjectType: businessObject,
                    Top: currentTop,
                    Skip: skip
                };

                const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                    method: 'POST',
                    url: `${baseUrl}/api/rest/search/fulltext`,
                    body,
                    json: true,
                    skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                });

                if (response.data && Array.isArray(response.data)) {
                    allItems = allItems.concat(response.data as IDataObject[]);
                    remaining -= response.data.length;

                    if (response.data.length < currentTop) {
                        break;
                    }
                    skip += response.data.length;
                } else {
                    break;
                }
            }

            allItems.forEach((item) => returnData.push({
                json: item,
                pairedItem: { item: i },
            }));

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
