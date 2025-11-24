import { INodeProperties } from 'n8n-workflow';

export const operation: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
        show: {
            resource: ['businessObject'],
        },
    },
    options: [
        {
            name: 'Create',
            value: 'create',
            description: 'Create a business object',
            action: 'Create a business object',
        },
        {
            name: 'Delete',
            value: 'delete',
            description: 'Delete a business object',
            action: 'Delete a business object',
        },
        {
            name: 'Get',
            value: 'get',
            description: 'Get a business object',
            action: 'Get a business object',
        },
        {
            name: 'Get Many',
            value: 'getAll',
            description: 'Get many business objects',
            action: 'Get many business objects',
        },
        {
            name: 'Update',
            value: 'update',
            description: 'Update a business object',
            action: 'Update a business object',
        },
    ],
    default: 'get',
};
