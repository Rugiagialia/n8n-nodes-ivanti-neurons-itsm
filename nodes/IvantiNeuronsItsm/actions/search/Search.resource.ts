import { INodeProperties } from 'n8n-workflow';

export const operation: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
        show: {
            resource: ['search'],
        },
    },
    options: [
        {
            name: 'Execute Saved Search',
            value: 'executeSavedSearch',
            description: 'Execute a saved search',
            action: 'Execute a saved search',
        },
        {
            name: 'Full Text Search',
            value: 'fullTextSearch',
            description: 'Perform a full-text search across business objects',
            action: 'Perform a full text search',
        },
        {
            name: 'Simple Search',
            value: 'simpleSearch',
            description: 'Get business objects by search text',
            action: 'Get business objects by search text',
        },
    ],
    default: 'simpleSearch',
};
