import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';

import { router } from './actions/router';
import * as localization from './actions/localization';
import * as search from './actions/search';

export class IvantiNeuronsItsmWebService implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Ivanti Neurons for ITSM (Web Service)',
        name: 'ivantiNeuronsItsmWebService',
        icon: { light: 'file:ivanti.light.svg', dark: 'file:ivanti.dark.svg' },
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
        description: 'Interact with Ivanti Neurons for ITSM using Internal Web Services',
        defaults: {
            name: 'Ivanti Neurons for ITSM (Web Service)',
        },
        usableAsTool: true,
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'ivantiNeuronsItsmWebServiceApi',
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
                        name: 'Localization',
                        value: 'localization',
                    },
                    {
                        name: 'Search',
                        value: 'search',
                    },
                ],
                default: 'localization',
            },

            // ----------------------------------
            // Localization
            // ----------------------------------
            ...localization.resource.resource,
            ...localization.get.properties,
            ...localization.update.properties,

            // ----------------------------------
            // Search
            // ----------------------------------
            ...search.description,
        ],
    };

    methods = {
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        return await router.call(this);
    }
}
