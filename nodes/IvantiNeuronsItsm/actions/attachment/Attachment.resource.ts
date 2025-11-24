import { INodeProperties } from 'n8n-workflow';

export const operation: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
        show: {
            resource: ['attachment'],
        },
    },
    options: [
        {
            name: 'Upload',
            value: 'upload',
            description: 'Upload an attachment',
            action: 'Upload an attachment',
        },
        {
            name: 'Delete',
            value: 'delete',
            description: 'Delete an attachment',
            action: 'Delete an attachment',
        },
        {
            name: 'Get',
            value: 'get',
            description: 'Get an attachment',
            action: 'Get an attachment',
        },
    ],
    default: 'get',
};
