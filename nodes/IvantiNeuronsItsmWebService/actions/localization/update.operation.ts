import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
    IDataObject,
    NodeApiError,
    JsonObject,
} from 'n8n-workflow';
import { executeWithSession, IIvantiSession, sleep, getWebServiceErrorDetails } from '../common';

export const properties: INodeProperties[] = [
    {
        displayName: 'Business Object Name',
        name: 'tableRef',
        type: 'string',
        default: 'CI#',
        description: 'The internal name of the Business Object (e.g. CI#, Incident#)',
        required: true,
        displayOptions: {
            show: {
                resource: ['localization'],
                operation: ['update'],
            },
        },
    },
    {
        displayName: 'Record ID',
        name: 'objectId',
        type: 'string',
        default: '',
        description: 'The unique identifier (RecId) of the record',
        required: true,
        displayOptions: {
            show: {
                resource: ['localization'],
                operation: ['update'],
            },
        },
    },
    {
        displayName: 'Localized Values',
        name: 'values',
        type: 'json',
        default: '[]',
        description: 'Array of localized values (e.g. [{"FieldName":"Name","LanguagePackId":"en-US","Value":"foo"}])',
        required: true,
        displayOptions: {
            show: {
                resource: ['localization'],
                operation: ['update'],
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
                resource: ['localization'],
                operation: ['update'],
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

export async function execute(this: IExecuteFunctions, items: INodeExecutionData[]): Promise<INodeExecutionData[]> {
    return await (executeWithSession.call(this, async (session: IIvantiSession) => {
        const result: INodeExecutionData[] = [];
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
                const tableRef = this.getNodeParameter('tableRef', i) as string;
                const objectId = this.getNodeParameter('objectId', i) as string;
                let values = this.getNodeParameter('values', i) as IDataObject | IDataObject[];

                if (typeof values === 'string') {
                    try {
                        values = JSON.parse(values);
                    } catch {
                        // Fallback or leave as string if parse fails (will likely error downstream)
                    }
                }

                const body = {
                    TableRef: tableRef,
                    objectId,
                    validatorRefId: '',
                    fieldValue: '',
                    values,
                    _csrfToken: session.csrfToken,
                };

                await session.request({
                    endpoint: '/Services/FormService.asmx/UpdateTranslations',
                    method: 'POST',
                    body,
                    headers: {
                        'Cookie': session.cookies.join('; '),
                    },
                });

                result.push({
                    json: { success: true, recordId: objectId },
                });

            } catch (error) {
                const { message, description } = getWebServiceErrorDetails(error);

                if (this.continueOnFail()) {
                    result.push({
                        json: {
                            error: message,
                            details: Array.isArray(description) ? description.join('\n') : description,
                        }
                    });
                    continue;
                }
                throw new NodeApiError(this.getNode(), error as JsonObject, {
                    message,
                    description: Array.isArray(description) ? description.join('\n') : description,
                });
            }

            // Apply batching delay
            if (i > 0 && batchSize >= 0 && batchInterval > 0) {
                if (i % batchSize === 0) {
                    await sleep(batchInterval);
                }
            }
        }

        return result;
    }) as Promise<INodeExecutionData[]>);
}
