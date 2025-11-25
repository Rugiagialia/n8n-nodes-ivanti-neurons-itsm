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
                operation: ['update'],
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
                operation: ['update'],
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
                operation: ['update'],
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
                operation: ['update'],
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
                        '/operation': ['update'],
                        '/mode': ['manual'],
                    },
                },
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
                method: 'PUT',
                url: `${baseUrl}/api/odata/businessobject/${objectName}('${recId}')`,
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

        if (batchSize !== -1 && batchInterval > 0 && (i + 1) % effectiveBatchSize === 0 && (i + 1) < items.length) {
            await sleep(batchInterval);
        }
    }

    return returnData;
}
