import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
    // NodeApiError,
    IDataObject,
    // JsonObject,
} from 'n8n-workflow';

import { sleep } from '../../methods/helpers';

export const properties: INodeProperties[] = [
    // ... existing properties (properties array content is preserved, only execute is fully replaced below)
    {
        displayName: 'Requester User ID',
        name: 'strUserId',
        type: 'resourceLocator',
        default: { mode: 'list', value: '' },
        required: true,
        modes: [
            {
                displayName: 'From List',
                name: 'list',
                type: 'list',
                typeOptions: {
                    searchListMethod: 'getEmployees',
                    searchable: true,
                },
            },
            {
                displayName: 'By ID',
                name: 'id',
                type: 'string',
            },
        ],
        description: 'The RecID of the user for whom to fetch subscriptions',
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Request On Behalf of Another User',
        name: 'requestOnBehalf',
        type: 'boolean',
        default: false,
        description: 'Whether to create the request for a different user than the one whose subscriptions are selected',
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Actual Requester User ID',
        name: 'alternateRequesterId',
        type: 'resourceLocator',
        default: { mode: 'list', value: '' },
        required: true,
        modes: [
            {
                displayName: 'From List',
                name: 'list',
                type: 'list',
                typeOptions: {
                    searchListMethod: 'getEmployees',
                    searchable: true,
                },
            },
            {
                displayName: 'By ID',
                name: 'id',
                type: 'string',
            },
        ],
        description: 'The RecID of the user who will be the actual requester',
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['create'],
                requestOnBehalf: [true],
            },
        },
    },
    {
        displayName: 'Subscription ID',
        name: 'subscriptionId',
        type: 'resourceLocator',
        default: { mode: 'list', value: '' },
        required: true,
        modes: [
            {
                displayName: 'From List',
                name: 'list',
                type: 'list',
                typeOptions: {
                    searchListMethod: 'getSubscriptions',
                    searchable: true,
                },
            },
            {
                displayName: 'By ID',
                name: 'id',
                type: 'string',
            },
        ],
        description: 'The Service Request Subscription ID (Template)',
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Set Details',
        name: 'provideDetails',
        type: 'boolean',
        default: false,
        description: 'Whether to provide a custom Subject and Symptom for the request',
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Subject',
        name: 'subject',
        type: 'string',
        default: '',
        description: 'The subject line of the Service Request',
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['create'],
                provideDetails: [true],
            },
        },
    },
    {
        displayName: 'Symptom',
        name: 'symptom',
        type: 'string',
        default: '',
        description: 'The detailed description or symptom of the request',
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['create'],
                provideDetails: [true],
            },
        },
    },
    {
        displayName: 'For List parameters with multiple selections, separate values and RecIDs using ~^ (e.g., value1~^value2~^value3)',
        name: 'listParameterNotice',
        type: 'notice',
        default: '',
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Parameters',
        name: 'parameters',
        type: 'resourceMapper',
        default: {
            mappingMode: 'defineBelow',
            value: null,
        },
        required: true,
        typeOptions: {
            loadOptionsDependsOn: ['subscriptionId.value'],
            resourceMapper: {
                resourceMapperMethod: 'getSubscriptionParametersSchema',
                mode: 'add',
                valuesLabel: 'Parameter Values',
                supportAutoMap: false,
                fieldWords: {
                    singular: 'parameter',
                    plural: 'parameters',
                },
                addAllFields: true,
                multiKeyMatch: true,
            },
        },
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['create'],
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
                resource: ['serviceRequest'],
                operation: ['create'],
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
            {
                displayName: 'Delayed Fulfill',
                name: 'delayedFulfill',
                type: 'boolean',
                default: false,
                description: 'Whether to delay the fulfillment of the request',
            },
            {
                displayName: 'Form Name',
                name: 'formName',
                type: 'string',
                default: '',
                description: 'The specific form name to use for this request',
            },
            {
                displayName: 'Local Offset (Minutes)',
                name: 'localOffset',
                type: 'number',
                default: 0,
                description: 'The time zone offset in minutes',
            },
            {
                displayName: 'Save Request State',
                name: 'saveReqState',
                type: 'boolean',
                default: false,
                description: 'Whether to save the request state during creation',
            },
            {
                displayName: 'Use Schema Cache',
                name: 'useSchemaCache',
                type: 'boolean',
                default: true,
                description: 'Whether to cache the service request template schema in memory during execution. This improves performance when processing multiple requests for the same template.',
            },
        ],
    },
];

export async function execute(
    this: IExecuteFunctions,
    items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];

    // Helper to extract ID and Location from "RecId|Location" format
    const parseUserValue = (value: string) => {
        if (value && value.includes('|')) {
            const [recId, location] = value.split('|');
            return { recId, location };
        }
        return { recId: value, location: undefined };
    };

    const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
    const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

    // In-memory cache for template parameters schema: TemplateRecID -> Promise<{ [key: string]: string }>
    const templateSchemaCache = new Map<string, Promise<{ [key: string]: string }>>();

    // Determine batch size and interval from the first item (assuming consistent options)
    const options = this.getNodeParameter('options', 0, {}) as IDataObject;
    const batching = options.batching as IDataObject;
    const batchOptions = batching?.batch as IDataObject;

    let batchSize = batchOptions?.batchSize as number;
    if (batchSize === undefined) batchSize = 50; // Default to 50
    const batchInterval = batchOptions?.batchInterval as number || 0; // Default to 0 (disabled)

    if (batchSize <= 0) {
        batchSize = items.length; // Process all at once if disabled or 0
    }

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        // Process batch items in parallel (Promise.all)
        // Note: For create, we usually process individually within the batch loop to handle errors per item

        await Promise.all(batch.map(async (item, batchIndex) => {
            const itemIndex = i + batchIndex;
            try {
                const strUserIdValue = this.getNodeParameter('strUserId', itemIndex) as IDataObject;
                let rawUserId = (strUserIdValue.value || strUserIdValue) as string;

                const requestOnBehalf = this.getNodeParameter('requestOnBehalf', itemIndex) as boolean;
                if (requestOnBehalf) {
                    const alternateRequesterIdValue = this.getNodeParameter('alternateRequesterId', itemIndex) as IDataObject;
                    rawUserId = (alternateRequesterIdValue.value || alternateRequesterIdValue) as string;
                }

                const { recId: strUserId, location: userLocation } = parseUserValue(rawUserId);

                const subscriptionIdValue = this.getNodeParameter('subscriptionId', itemIndex) as IDataObject;
                const rawSubscriptionId = (subscriptionIdValue.value || subscriptionIdValue) as string;

                // Handle composite ID "SubscriptionID|TemplateRecID"
                let subscriptionId = rawSubscriptionId;
                if (rawSubscriptionId && typeof rawSubscriptionId === 'string' && rawSubscriptionId.includes('|')) {
                    subscriptionId = rawSubscriptionId.split('|')[0];
                }

                const provideDetails = this.getNodeParameter('provideDetails', itemIndex) as boolean;
                let serviceReqData = {};
                if (provideDetails) {
                    const subject = this.getNodeParameter('subject', itemIndex) as string;
                    const symptom = this.getNodeParameter('symptom', itemIndex) as string;
                    serviceReqData = {
                        Subject: subject,
                        Symptom: symptom,
                    };
                }

                const itemOptions = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
                const delayedFulfill = itemOptions.delayedFulfill as boolean || false;
                const formName = itemOptions.formName as string;
                const saveReqState = itemOptions.saveReqState as boolean || false;
                const localOffset = itemOptions.localOffset as number || 0;

                const useSchemaCache = itemOptions.useSchemaCache !== false; // Default to true


                const parameters: IDataObject = {};
                const parametersMappingMode = this.getNodeParameter('parameters.mappingMode', itemIndex, 'defineBelow') as string;
                let parametersValue: IDataObject = {};

                if (parametersMappingMode === 'defineBelow') {
                    parametersValue = this.getNodeParameter('parameters.value', itemIndex, {}) as IDataObject;
                } else {
                    // autoMapInputData
                    parametersValue = item.json;
                }

                // Fetch parameter schema to determine types for formatting
                let templateRecId = rawSubscriptionId;
                if (rawSubscriptionId && typeof rawSubscriptionId === 'string' && rawSubscriptionId.includes('|')) {
                    const parts = rawSubscriptionId.split('|');
                    if (parts.length > 1) {
                        templateRecId = parts[1];
                    }
                }

                // Fetch schema for type information
                let parameterTypes: { [key: string]: string } = {};

                if (templateRecId) {
                    if (useSchemaCache) {
                        let schemaPromise = templateSchemaCache.get(templateRecId);
                        if (!schemaPromise) {
                            schemaPromise = (async () => {
                                try {
                                    const allowUnauthorizedCerts = credentials.allowUnauthorizedCerts as boolean;
                                    const schemaOptions = {
                                        method: 'GET' as const,
                                        url: `${baseUrl}/api/odata/businessobject/ServiceReqTemplateParams`,
                                        qs: {
                                            $filter: `ParentLink_RecID eq '${templateRecId}'`,
                                            $select: 'RecId,DisplayType',
                                        },
                                        json: true,
                                        skipSslCertificateValidation: allowUnauthorizedCerts,
                                    };
                                    const schemaResponse = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', schemaOptions);
                                    const schemaItems = schemaResponse.value || [];

                                    const newSchema: { [key: string]: string } = {};
                                    for (const schemaItem of schemaItems) {
                                        newSchema[schemaItem.RecId] = (schemaItem.DisplayType || '').toLowerCase();
                                    }
                                    return newSchema;
                                } catch {
                                    return {};
                                }
                            })();
                            templateSchemaCache.set(templateRecId, schemaPromise);
                        }
                        parameterTypes = await schemaPromise;
                    } else {
                        try {
                            const allowUnauthorizedCerts = credentials.allowUnauthorizedCerts as boolean;
                            const schemaOptions = {
                                method: 'GET' as const,
                                url: `${baseUrl}/api/odata/businessobject/ServiceReqTemplateParams`,
                                qs: {
                                    $filter: `ParentLink_RecID eq '${templateRecId}'`,
                                    $select: 'RecId,DisplayType',
                                },
                                json: true,
                                skipSslCertificateValidation: allowUnauthorizedCerts,
                            };
                            const schemaResponse = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', schemaOptions);
                            const schemaItems = schemaResponse.value || [];

                            for (const schemaItem of schemaItems) {
                                parameterTypes[schemaItem.RecId] = (schemaItem.DisplayType || '').toLowerCase();
                            }
                        } catch {
                            // If schema fetch fails, continue with string values
                        }
                    }
                }

                for (const key of Object.keys(parametersValue)) {
                    if (key === 'subscriptionId' || key === 'strUserId') continue; // Skip other props if auto-mapping

                    let value = parametersValue[key];
                    if (value === undefined || value === null) continue;

                    // Get the original RecId (remove _option suffix if present)
                    const recId = key.endsWith('_option') ? key.replace('_option', '') : key;
                    const fieldType = parameterTypes[recId] || '';

                    // Convert boolean to string for API
                    if (typeof value === 'boolean') {
                        value = String(value);
                    } else if (typeof value === 'object' && value !== null) {
                        // Handle potential Luxon objects or other object types
                        value = String(value);
                    }

                    // Format date/datetime/time values
                    if (typeof value === 'string' && value.trim()) {
                        if (fieldType.includes('datetime')) {
                            // DateTime: Preserve local time, replace offset with Z
                            // Input: 2025-12-18T13:28:08.000+02:00 -> Output: 2025-12-18T13:28:08Z

                            // Remove milliseconds if present
                            if (value.includes('.')) {
                                value = value.replace(/\.\d{3}/, '');
                            }

                            // Replace timezone offset (+02:00 or -05:00) with Z
                            if (value.match(/[+-]\d{2}:\d{2}$/)) {
                                value = value.replace(/[+-]\d{2}:\d{2}$/, 'Z');
                            } else if (value.includes('T') && !value.endsWith('Z')) {
                                value = value + 'Z';
                            }
                        } else if (fieldType.includes('date') && !fieldType.includes('datetime')) {
                            // Date only: force midnight UTC
                            // Use string matching to get the date part regardless of input timezone
                            // Input: 2025-12-17T00:03:00.000+02:00 -> Output: 2025-12-17T00:00:00Z
                            const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
                            if (dateMatch) {
                                // Construct date string directly to avoid any timezone object creation issues
                                value = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T00:00:00Z`;
                            }
                        }
                        // Time fields are already strings, no conversion needed
                    }

                    if (key.endsWith('_option')) {
                        const originalRecId = key.replace('_option', '');
                        parameters[`par-${originalRecId}-recId`] = value as string;
                    } else {
                        // Assume keys are RecIDs (from schema)
                        parameters[`par-${key}`] = value as string;
                    }

                }

                const body: IDataObject = {
                    attachmentsToDelete: [],
                    attachmentsToUpload: [],
                    parameters,
                    delayedFulfill,
                    saveReqState,
                    serviceReqData,
                    strUserId,
                    subscriptionId,
                };

                // Only include localOffset if explicitly set (not default 0)
                if (localOffset !== 0) {
                    body.localOffset = localOffset;
                }

                if (formName) {
                    body.formName = formName;
                }

                if (userLocation) {
                    body.strCustomerLocation = userLocation;
                }

                const requestOptions = {
                    method: 'POST' as const,
                    url: `${baseUrl}/api/rest/ServiceRequest/new`,
                    body,
                    json: true,
                };

                const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', requestOptions);
                const responseData = response as IDataObject;



                const executionData = this.helpers.constructExecutionMetaData(
                    this.helpers.returnJsonArray(responseData),
                    { itemData: { item: itemIndex } },
                );
                returnData.push(...executionData);

            } catch (error) {
                if (this.continueOnFail()) {
                    const executionData = this.helpers.constructExecutionMetaData(
                        this.helpers.returnJsonArray({ error: error.message }),
                        { itemData: { item: itemIndex } },
                    );
                    returnData.push(...executionData);
                    return;
                }
                throw error;
            }
        }));

        if (batchInterval > 0 && i + batchSize < items.length) {
            await sleep(batchInterval);
        }
    }

    return returnData;
}
