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
            // eslint-disable-next-line n8n-nodes-base/node-param-option-name-wrong-for-get-many
            name: 'Get Submitted Parameters',
            value: 'getAll',
            // eslint-disable-next-line n8n-nodes-base/node-param-operation-option-description-wrong-for-get-many
            description: 'Get all submitted parameters for an existing service request',
            action: 'Get submitted parameters',
        },
    ],
    default: 'create',
};
