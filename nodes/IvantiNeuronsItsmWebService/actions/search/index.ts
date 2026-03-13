import { INodeProperties } from 'n8n-workflow';
import * as query from './search.operation';

export { query };

export const description: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: [
                    'search',
                ],
            },
        },
        options: [
            {
                name: 'Query',
                value: 'query',
                description: 'Build and execute a complex query with relationships',
                action: 'Query records',
            },
        ],
        default: 'query',
    },
    ...query.properties,
];
