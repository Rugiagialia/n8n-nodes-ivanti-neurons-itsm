import { INodeProperties } from 'n8n-workflow';

export const operation: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
        show: {
            resource: ['relationship'],
        },
    },
    options: [
        {
            name: 'Create',
            value: 'create',
            description: 'Link two business objects',
            action: 'Link two business objects',
        },
        {
            name: 'Delete',
            value: 'delete',
            description: 'Delete a link between business objects',
            action: 'Delete a link between business objects',
        },
        {
            name: 'Get Related',
            value: 'getRelated',
            description: 'Get related business objects',
            action: 'Get related business objects',
        },
    ],
    default: 'getRelated',
};
