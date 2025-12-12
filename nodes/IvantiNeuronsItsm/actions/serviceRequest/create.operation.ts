import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
    IDataObject,
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
];

export async function execute(
    this: IExecuteFunctions,
    items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];

    // This operation currently acts as a UI test for resourceLocator.
    // It echoes the selected ID.
    for (let i = 0; i < items.length; i++) {
        const strUserIdValue = this.getNodeParameter('strUserId', i) as IDataObject;
        const strUserId = (strUserIdValue.value || strUserIdValue) as string;

        const requestOnBehalf = this.getNodeParameter('requestOnBehalf', i) as boolean;
        let actualRequesterId = strUserId;

        if (requestOnBehalf) {
            const alternateRequesterIdValue = this.getNodeParameter('alternateRequesterId', i) as IDataObject;
            actualRequesterId = (alternateRequesterIdValue.value || alternateRequesterIdValue) as string;
        }

        const subscriptionIdValue = this.getNodeParameter('subscriptionId', i) as IDataObject;
        const subscriptionId = (subscriptionIdValue.value || subscriptionIdValue) as string;

        returnData.push({
            json: {
                message: 'Resource Locator Test',
                subscriptionUser: strUserId,
                actualRequester: actualRequesterId,
                subscriptionId,
                requestOnBehalf,
            },
            pairedItem: {
                item: i,
            },
        });
    }

    return returnData;
}
