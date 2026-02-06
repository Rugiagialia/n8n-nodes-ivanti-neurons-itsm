import { INodeProperties } from 'n8n-workflow';

export const resource: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['localization'],
            },
        },
        options: [
            {
                name: 'Get',
                value: 'get',
                description: 'Get localized values for a specific record field',
                action: 'Get localized values',
            },
            {
                name: 'Update',
                value: 'update',
                description: 'Update localized values for a specific record field',
                action: 'Update localized values',
            },
        ],
        default: 'get',
    },
];
