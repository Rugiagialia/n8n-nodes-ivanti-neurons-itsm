import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';

import { router } from './actions/router';
import * as businessObject from './actions/businessObject';
import * as relationship from './actions/relationship';
import * as attachment from './actions/attachment';
import * as search from './actions/search';
import { getObjectFields, getSavedSearches } from './methods/loadOptions';

export class IvantiNeuronsItsm implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Ivanti Neurons for ITSM',
        name: 'ivantiNeuronsItsm',
        icon: 'file:ivanti.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
        description: 'Interact with Ivanti Neurons for ITSM',
        defaults: {
            name: 'Ivanti Neurons for ITSM',
        },
        usableAsTool: true,
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'ivantiNeuronsItsmApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Business Object',
                        value: 'businessObject',
                    },
                    {
                        name: 'Relationship',
                        value: 'relationship',
                    },
                    {
                        name: 'Attachment',
                        value: 'attachment',
                    },
                    {
                        name: 'Search',
                        value: 'search',
                    },
                ],
                default: 'businessObject',
            },

            // ----------------------------------
            // Business Object
            // ----------------------------------
            businessObject.resource.operation,
            {
                displayName: 'Business Object Name',
                name: 'businessObject',
                type: 'string',
                default: 'Incident',
                description: 'Name of the business object (e.g. Incident, Change). An "s" will be automatically appended to the end (e.g. Incident -> Incidents, Journal__Notes -> Journal__Notess).',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['businessObject'],
                    },
                },
            },
            {
                displayName: 'Record ID',
                name: 'recId',
                type: 'string',
                default: '',
                description: 'The unique identifier of the record',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['businessObject'],
                        operation: ['get', 'delete', 'update'],
                    },
                },
            },
            ...businessObject.create.properties,
            ...businessObject.delete.properties,
            ...businessObject.get.properties,
            ...businessObject.getAll.properties,
            ...businessObject.update.properties,

            // ----------------------------------
            // Relationship
            // ----------------------------------
            relationship.resource.operation,
            {
                displayName: 'Business Object Name',
                name: 'businessObject',
                type: 'string',
                default: 'Incident',
                description: 'Name of the business object (e.g. Incident, Change). An "s" will be automatically appended to the end (e.g. Incident -> Incidents, Journal__Notes -> Journal__Notess).',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['relationship'],
                    },
                },
            },
            {
                displayName: 'Record ID',
                name: 'recId',
                type: 'string',
                default: '',
                description: 'The unique identifier of the record',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['relationship'],
                    },
                },
            },
            {
                displayName: 'Relationship Name',
                name: 'relationshipName',
                type: 'string',
                default: '',
                description: 'Name of the relationship (e.g. IncidentContainsJournal)',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['relationship'],
                    },
                },
            },
            {
                displayName: 'Related Record ID',
                name: 'relatedRecId',
                type: 'string',
                default: '',
                description: 'The unique identifier of the related record',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['relationship'],
                        operation: ['create', 'delete'],
                    },
                },
            },
            ...relationship.create.properties,
            ...relationship.delete.properties,
            ...relationship.getRelated.properties,

            // ----------------------------------
            // Attachment
            // ----------------------------------
            attachment.resource.operation,
            {
                displayName: 'Record ID',
                name: 'recId',
                type: 'string',
                default: '',
                description: 'The unique identifier of the record',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['attachment'],
                        operation: ['delete', 'get'],
                    },
                },
            },
            ...attachment.delete.properties,
            ...attachment.get.properties,
            ...attachment.upload.properties,

            // ----------------------------------
            // Search
            // ----------------------------------
            search.resource.operation,
            {
                displayName: 'Business Object Name',
                name: 'businessObject',
                type: 'string',
                default: 'Incident',
                description: 'Name of the business object (e.g. Incident, Change). An "s" will be automatically appended to the end (e.g. Incident -> Incidents, Journal__Notes -> Journal__Notess).',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['search'],
                    },
                },
            },
            ...search.executeSavedSearch.properties,
            ...search.fullTextSearch.properties,
            ...search.simpleSearch.properties,
        ],
    };

    methods = {
        loadOptions: {
            getObjectFields,
            getSavedSearches,
        },
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        return await router.call(this);
    }
}
