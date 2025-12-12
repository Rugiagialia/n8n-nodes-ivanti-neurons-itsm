import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
    // NodeApiError,
    IDataObject,
    // JsonObject,
} from 'n8n-workflow';

export const properties: INodeProperties[] = [
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
        displayName: 'Parameters',
        name: 'parameters',
        type: 'fixedCollection',
        default: {},
        typeOptions: {
            multipleValues: true,
        },
        displayOptions: {
            show: {
                resource: ['serviceRequest'],
                operation: ['create'],
            },
        },
        options: [
            {
                name: 'parameter',
                displayName: 'Parameter',
                values: [
                    {
                        displayName: 'Name',
                        name: 'name',
                        type: 'options',
                        typeOptions: {
                            loadOptionsMethod: 'getSubscriptionParameters',
                            loadOptionsDependsOn: ['subscriptionId'],
                        },
                        default: '',
                        description: 'Select the parameter. The name includes the type to guide you.',
                    },
                    {
                        displayName: 'Value',
                        name: 'value',
                        type: 'string',
                        default: '',
                        description: 'The value for the parameter',
                    },
                    {
                        displayName: 'Option RecID',
                        name: 'optionRecId',
                        type: 'string',
                        default: '',
                        description: 'Required for Dropdowns/Picklists. The RecID of the selected option.',
                    },
                ],
            },
        ],
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
                displayName: 'Save Request State',
                name: 'saveReqState',
                type: 'boolean',
                default: false,
                description: 'Whether to save the request state during creation',
            },
            {
                displayName: 'Local Offset (Minutes)',
                name: 'localOffset',
                type: 'number',
                default: 0,
                description: 'The time zone offset in minutes',
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

    for (let i = 0; i < items.length; i++) {
        try {
            const strUserIdValue = this.getNodeParameter('strUserId', i) as IDataObject;
            let rawUserId = (strUserIdValue.value || strUserIdValue) as string;

            const requestOnBehalf = this.getNodeParameter('requestOnBehalf', i) as boolean;
            if (requestOnBehalf) {
                const alternateRequesterIdValue = this.getNodeParameter('alternateRequesterId', i) as IDataObject;
                rawUserId = (alternateRequesterIdValue.value || alternateRequesterIdValue) as string;
            }

            const { recId: strUserId, location: userLocation } = parseUserValue(rawUserId);

            const subscriptionIdValue = this.getNodeParameter('subscriptionId', i) as IDataObject;
            const rawSubscriptionId = (subscriptionIdValue.value || subscriptionIdValue) as string;

            // Handle composite ID "SubscriptionID|TemplateRecID"
            let subscriptionId = rawSubscriptionId;
            if (rawSubscriptionId && rawSubscriptionId.includes('|')) {
                subscriptionId = rawSubscriptionId.split('|')[0];
            }

            const provideDetails = this.getNodeParameter('provideDetails', i) as boolean;
            let serviceReqData = {};
            if (provideDetails) {
                const subject = this.getNodeParameter('subject', i) as string;
                const symptom = this.getNodeParameter('symptom', i) as string;
                serviceReqData = {
                    Subject: subject,
                    Symptom: symptom,
                };
            }

            const options = this.getNodeParameter('options', i, {}) as IDataObject;
            const delayedFulfill = options.delayedFulfill as boolean || false;
            const formName = options.formName as string;
            const saveReqState = options.saveReqState as boolean || false;
            const localOffset = options.localOffset as number || 0;

            const parameterItems = this.getNodeParameter('parameters', i, {}) as IDataObject;
            const parameters: IDataObject = {};
            if (parameterItems.parameter) {
                for (const param of parameterItems.parameter as IDataObject[]) {
                    const paramRecId = param.name as string;
                    const value = param.value as string;
                    const optionRecId = param.optionRecId as string;

                    if (paramRecId) {
                        parameters[`par-${paramRecId}`] = value;
                        if (optionRecId) {
                            parameters[`par-${paramRecId}-recId`] = optionRecId;
                        }
                    }
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
                localOffset,
            };

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

            const executionData = this.helpers.constructExecutionMetaData(
                this.helpers.returnJsonArray(response as IDataObject[]),
                { itemData: { item: i } },
            );
            returnData.push(...executionData);

        } catch (error) {
            if (this.continueOnFail()) {
                const executionData = this.helpers.constructExecutionMetaData(
                    this.helpers.returnJsonArray({ error: error.message }),
                    { itemData: { item: i } },
                );
                returnData.push(...executionData);
                continue;
            }
            throw error;
        }
    }

    return returnData;
}
