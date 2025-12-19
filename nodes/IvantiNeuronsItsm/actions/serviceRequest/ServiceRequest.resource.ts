import { INodeProperties } from 'n8n-workflow';

export const operation: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
        show: {
            resource: ['serviceRequest'],
        },
    },
    options: [
        {
            name: 'Create',
            value: 'create',
            description: 'Create a new service request',
            action: 'Create a service request',
        },
        {
            name: 'Get Submitted Parameters',
            value: 'getAll',
            description: 'Get all submitted parameters for an existing service request',
            action: 'Get submitted parameters',
        },
    ],
    default: 'create',
};
