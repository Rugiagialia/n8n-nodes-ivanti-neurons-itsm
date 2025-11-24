import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IDataObject,
    ILoadOptionsFunctions,
} from 'n8n-workflow';

export class IvantiNeuronsItsm implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Ivanti Neurons for ITSM',
        name: 'ivantiNeuronsItsm',
        icon: 'file:../../icons/ivanti.svg',
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
                ],
                default: 'businessObject',
            },
            {
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
                default: 'create',
            },
            {
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
                        value: 'createRelationship',
                        description: 'Link two business objects',
                        action: 'Link two business objects',
                    },
                    {
                        name: 'Delete',
                        value: 'deleteRelationship',
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
                default: 'createRelationship',
            },
            {
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
                default: 'create',
            },
            {
                displayName: 'Business Object Name',
                name: 'businessObject',
                type: 'string',
                default: 'Incident',
                description: 'Name of the business object (e.g. Incident, Change). An "s" will be automatically appended to the end (e.g. Incident -> Incidents, Journal__Notes -> Journal__Notess).',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['businessObject', 'relationship'],
                    },
                    hide: {
                        resource: ['attachment'],
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
                        resource: ['businessObject', 'relationship', 'attachment'],
                        operation: ['get', 'delete', 'update', 'createRelationship', 'deleteRelationship', 'getRelated'],
                    },
                },
            },
            {
                displayName: 'Record ID',
                name: 'recId',
                type: 'string',
                default: '',
                description: 'The unique identifier of the business object to attach to',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['attachment'],
                        operation: ['upload'],
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
                        operation: ['createRelationship', 'deleteRelationship'],
                    },
                },
            },
            {
                displayName: 'Business Object Name',
                name: 'businessObject',
                type: 'string',
                default: 'Incident',
                description: 'Name of the business object (e.g. Incident, Change). An "s" will be automatically appended to the end (e.g. Incident -> Incidents, Journal__Notes -> Journal__Notess).',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['attachment'],
                        operation: ['upload'],
                    },
                },
            },

            {
                displayName: 'Input Binary Field',
                name: 'binaryPropertyName',
                type: 'string',
                default: 'data',
                description: 'The name of the binary property which contains the data for the file to be uploaded',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['attachment'],
                        operation: ['upload'],
                    },
                },
            },
            {
                displayName: 'Options',
                name: 'options',
                type: 'collection',
                placeholder: 'Add Option',
                default: {},
                displayOptions: {
                    show: {
                        resource: ['attachment'],
                        operation: ['upload'],
                    },
                },
                options: [
                    {
                        displayName: 'File Name',
                        name: 'fileName',
                        type: 'string',
                        default: '',
                        placeholder: 'Leave empty to use original filename',
                        description: 'Name for the uploaded file. If not specified, uses the original filename from the binary data.',
                    },
                ],
            },
            {
                displayName: 'Mode',
                name: 'mode',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['businessObject'],
                        operation: ['create', 'update'],
                    },
                },
                options: [
                    {
                        name: 'Manual Mapping',
                        value: 'manual',
                        description: 'Edit item fields one by one',
                        action: 'Edit item fields one by one',
                    },
                    {
                        name: 'JSON',
                        value: 'json',
                        description: 'Customize item output with JSON',
                        action: 'Customize item output with JSON',
                    },
                ],
                default: 'manual',
            },
            {
                displayName: 'Fields to Set',
                name: 'assignments',
                type: 'assignmentCollection',
                default: {},
                displayOptions: {
                    show: {
                        resource: ['businessObject'],
                        operation: ['create', 'update'],
                        mode: ['manual'],
                    },
                },
            },
            {
                displayName: 'JSON',
                name: 'body',
                type: 'json',
                default: '{\n  "field_name": "value"\n}',
                description: 'Fields to send in the request body',
                displayOptions: {
                    show: {
                        resource: ['businessObject'],
                        operation: ['create', 'update'],
                        mode: ['json'],
                    },
                },
            },

            {
                displayName: 'Return All',
                name: 'returnAll',
                type: 'boolean',
                default: false,
                description: 'Whether to return all results or only up to a given limit',
                displayOptions: {
                    show: {
                        resource: ['businessObject'],
                        operation: ['getAll'],
                    },
                },
            },
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 50,
                description: 'Max number of results to return',
                typeOptions: {
                    minValue: 1,
                },
                displayOptions: {
                    show: {
                        resource: ['businessObject'],
                        operation: ['getAll'],
                        returnAll: [false],
                    },
                },
            },
            {
                displayName: 'Send Select Parameters',
                name: 'useSelect',
                type: 'boolean',
                default: false,
                description: 'Whether to specify which fields to return',
                displayOptions: {
                    show: {
                        resource: ['businessObject'],
                        operation: ['get', 'getAll'],
                    },
                },
            },
            {
                displayName: 'Select Mode',
                name: 'selectMode',
                type: 'options',
                options: [
                    {
                        name: 'From List',
                        value: 'list',
                        description: 'Select fields from a dropdown (fetches available fields)',
                    },
                    {
                        name: 'Manual',
                        value: 'manual',
                        description: 'Enter field names manually as comma-separated list',
                    },
                ],
                default: 'manual',
                displayOptions: {
                    show: {
                        resource: ['businessObject'],
                        operation: ['get', 'getAll'],
                        useSelect: [true],
                    },
                },
            },
            {
                displayName: 'Select',
                name: 'select',
                type: 'multiOptions',
                typeOptions: {
                    loadOptionsMethod: 'getObjectFields',
                },
                default: [],
                description: 'Fields to return in the response',
                displayOptions: {
                    show: {
                        resource: ['businessObject'],
                        operation: ['get', 'getAll'],
                        useSelect: [true],
                        selectMode: ['list'],
                    },
                },
            },
            {
                displayName: 'Select (Manual)',
                name: 'selectManual',
                type: 'string',
                default: '',
                placeholder: 'RecId,Subject,Status',
                description: 'Comma-separated list of fields to return',
                displayOptions: {
                    show: {
                        resource: ['businessObject'],
                        operation: ['get', 'getAll'],
                        useSelect: [true],
                        selectMode: ['manual'],
                    },
                },
            },
            {
                displayName: 'Send Sort Parameters',
                name: 'useSort',
                type: 'boolean',
                default: false,
                description: 'Whether to sort the results',
                displayOptions: {
                    show: {
                        resource: ['businessObject'],
                        operation: ['getAll'],
                    },
                },
            },
            {
                displayName: 'Order By Field',
                name: 'orderByField',
                type: 'string',
                default: '',
                placeholder: 'CreatedDateTime',
                description: 'Field to sort by',
                displayOptions: {
                    show: {
                        resource: ['businessObject'],
                        operation: ['getAll'],
                        useSort: [true],
                    },
                },
            },
            {
                displayName: 'Order Direction',
                name: 'orderDirection',
                type: 'options',
                options: [
                    {
                        name: 'Ascending',
                        value: 'asc',
                    },
                    {
                        name: 'Descending',
                        value: 'desc',
                    },
                ],
                default: 'asc',
                description: 'Sort order direction',
                displayOptions: {
                    show: {
                        resource: ['businessObject'],
                        operation: ['getAll'],
                        useSort: [true],
                    },
                },
            },
            {
                displayName: 'Options',
                name: 'options',
                type: 'collection',
                placeholder: 'Add Option',
                default: {},
                displayOptions: {
                    show: {
                        resource: ['businessObject', 'relationship'],
                        operation: ['get', 'getAll', 'create', 'update', 'delete', 'createRelationship', 'deleteRelationship', 'getRelated'],
                    },
                },
                options: [
                    {
                        displayName: 'Filter',
                        name: 'filter',
                        type: 'string',
                        default: '',
                        description: 'OData filter expression (e.g. Status eq \'Active\', Owner eq \'$NULL\')',
                        displayOptions: {
                            show: {
                                '/operation': ['getAll'],
                            },
                        },
                    },
                    {
                        displayName: 'Ignore Type Conversion Errors',
                        name: 'ignoreConversionErrors',
                        type: 'boolean',
                        default: false,
                        description: 'Whether to ignore field type errors and apply a less strict type conversion',
                        displayOptions: {
                            show: {
                                '/operation': ['create', 'update'],
                                '/mode': ['manual'],
                            },
                        },
                    },
                    {
                        displayName: 'Items per Batch',
                        name: 'batchSize',
                        type: 'number',
                        typeOptions: {
                            minValue: -1,
                        },
                        default: 50,
                        description: 'Input will be split in batches to throttle requests. -1 for disabled. 0 will be treated as 1.',
                        displayOptions: {
                            show: {
                                '/operation': ['get', 'create', 'update', 'delete', 'createRelationship', 'deleteRelationship', 'getRelated'],
                            },
                        },
                    },
                    {
                        displayName: 'Batch Interval (ms)',
                        name: 'batchInterval',
                        type: 'number',
                        typeOptions: {
                            minValue: 0,
                        },
                        default: 1000,
                        description: 'Time (in milliseconds) between each batch of requests. 0 for disabled.',
                        displayOptions: {
                            show: {
                                '/operation': ['get', 'create', 'update', 'delete', 'createRelationship', 'deleteRelationship', 'getRelated'],
                            },
                        },
                    },
                    {
                        displayName: 'Pages per Batch',
                        name: 'pagesPerBatch',
                        type: 'number',
                        typeOptions: {
                            minValue: -1,
                        },
                        default: 10,
                        description: 'Number of pages to fetch before pausing. -1 to disable delays.',
                        displayOptions: {
                            show: {
                                '/operation': ['getAll'],
                            },
                        },
                    },
                    {
                        displayName: 'Pagination Interval (ms)',
                        name: 'paginationInterval',
                        type: 'number',
                        typeOptions: {
                            minValue: 0,
                        },
                        default: 100,
                        description: 'Time (in milliseconds) between each batch of page requests. 0 for disabled.',
                        displayOptions: {
                            show: {
                                '/operation': ['getAll'],
                            },
                        },
                    },
                ],
            },
        ],
    };

    methods = {
        loadOptions: {
            async getObjectFields(this: ILoadOptionsFunctions) {
                const businessObject = this.getCurrentNodeParameter('businessObject') as string;
                const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
                const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');
                const objectName = `${businessObject}s`;

                try {
                    // Fetch one record to get the available fields
                    const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
                    const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                        method: 'GET',
                        url: `${baseUrl}/api/odata/businessobject/${objectName}`,
                        qs: {
                            $top: 1,
                        },
                        json: true,
                        skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                    });

                    // Extract field names from the first record
                    const properties: Array<{ name: string; value: string }> = [];

                    if (response.value && Array.isArray(response.value) && response.value.length > 0) {
                        const firstRecord = response.value[0];
                        const fieldNames = Object.keys(firstRecord);

                        fieldNames.forEach((fieldName: string) => {
                            properties.push({
                                name: fieldName,
                                value: fieldName,
                            });
                        });
                    } else {
                        return [{ name: 'No records found to extract fields', value: '' }];
                    }

                    return properties.length > 0 ? properties.sort((a, b) => a.name.localeCompare(b.name)) : [{ name: 'No fields found', value: '' }];
                } catch (error) {
                    return [{ name: `Error: ${error.message}`, value: '' }];
                }
            },
        },
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        const resource = this.getNodeParameter('resource', 0) as string;
        const operation = this.getNodeParameter('operation', 0) as string;

        // Helper function to remove OData metadata from responses and sort keys
        const cleanODataResponse = (data: any): any => {
            if (data && typeof data === 'object') {
                const cleaned: IDataObject = {};
                const keys = Object.keys(data).filter((key) => key !== '@odata.context');

                // Sort keys alphabetically
                keys.sort();

                // Ensure RecId is first if it exists
                if (keys.includes('RecId')) {
                    cleaned['RecId'] = data['RecId'];
                    keys.splice(keys.indexOf('RecId'), 1);
                }

                // Add remaining keys
                keys.forEach((key) => {
                    cleaned[key] = data[key];
                });

                return cleaned;
            }
            return data;
        };

        // Helper function to create delays
        const sleep = async (ms: number): Promise<void> => {
            if (ms <= 0) return;
            return new Promise<void>((resolve) => {
                // @ts-ignore - setTimeout is available in Node.js
                setTimeout(resolve, ms);
            });
        };

        // Handle batching for create/update/delete operations
        const options = this.getNodeParameter('options', 0, {}) as IDataObject;
        const batchSize = (options.batchSize as number) !== undefined ? (options.batchSize as number) : -1;
        const batchInterval = (options.batchInterval as number) !== undefined ? (options.batchInterval as number) : 1000;

        // Process in batches if batching is enabled (batchSize !== -1)
        const shouldBatch = ['get', 'create', 'update', 'delete', 'createRelationship', 'deleteRelationship', 'getRelated'].includes(operation) && batchSize !== -1;
        const effectiveBatchSize = shouldBatch ? Math.max(1, batchSize) : items.length;

        for (let i = 0; i < items.length; i++) {
            try {
                if (resource === 'businessObject' || resource === 'relationship') {
                    const businessObject = this.getNodeParameter('businessObject', i) as string;
                    // User requested to always append 's' to the business object name.
                    // e.g. Incident -> Incidents, Journal__Notes -> Journal__Notess
                    const objectName = `${businessObject}s`;

                    if (operation === 'createRelationship') {
                        const recId = this.getNodeParameter('recId', i) as string;
                        const relationshipName = this.getNodeParameter('relationshipName', i) as string;
                        const relatedRecId = this.getNodeParameter('relatedRecId', i) as string;

                        const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
                        const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

                        await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                            method: 'PATCH',
                            url: `${baseUrl}/api/odata/businessobject/${objectName}('${recId}')/${relationshipName}('${relatedRecId}')/$Ref`,
                            body: {},
                            json: true,
                            skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                        });
                        returnData.push({ json: { success: true, message: 'Successfully created the link', recId, relatedRecId } });
                    } else if (operation === 'deleteRelationship') {
                        const recId = this.getNodeParameter('recId', i) as string;
                        const relationshipName = this.getNodeParameter('relationshipName', i) as string;
                        const relatedRecId = this.getNodeParameter('relatedRecId', i) as string;

                        const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
                        const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

                        await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                            method: 'DELETE',
                            url: `${baseUrl}/api/odata/businessobject/${objectName}('${recId}')/${relationshipName}('${relatedRecId}')/$Ref`,
                            json: true,
                            skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                        });
                        returnData.push({ json: { success: true, message: 'Successfully deleted the link', recId, relatedRecId } });
                    } else if (operation === 'getRelated') {
                        const recId = this.getNodeParameter('recId', i) as string;
                        const relationshipName = this.getNodeParameter('relationshipName', i) as string;

                        const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
                        const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

                        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                            method: 'GET',
                            url: `${baseUrl}/api/odata/businessobject/${objectName}('${recId}')/${relationshipName}`,
                            json: true,
                            skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                        });

                        if (response.value && Array.isArray(response.value)) {
                            const relatedItems = response.value.map((item: any) => ({
                                json: cleanODataResponse(item),
                                pairedItem: {
                                    item: i,
                                },
                            }));
                            returnData.push(...relatedItems);
                        } else {
                            returnData.push({
                                json: cleanODataResponse(response),
                                pairedItem: {
                                    item: i,
                                },
                            });
                        }
                    } else if (operation === 'create') {
                        const mode = this.getNodeParameter('mode', i) as string;
                        let body: IDataObject = {};

                        if (mode === 'json') {
                            body = this.getNodeParameter('body', i) as IDataObject;
                            if (typeof body === 'string') {
                                try {
                                    body = JSON.parse(body);
                                } catch (error) {
                                    throw new Error('Invalid JSON in "JSON" parameter');
                                }
                            }
                        } else {
                            const assignmentsData = this.getNodeParameter('assignments', i) as { assignments: Array<{ name: string; value: any; type?: string }> };
                            const options = this.getNodeParameter('options', i, {}) as IDataObject;
                            const ignoreConversionErrors = options.ignoreConversionErrors as boolean;

                            if (assignmentsData && assignmentsData.assignments) {
                                assignmentsData.assignments.forEach((assignment) => {
                                    const { name, value, type } = assignment;
                                    if (type === 'string') {
                                        body[name] = String(value);
                                    } else if (type === 'number') {
                                        const num = Number(value);
                                        if (isNaN(num)) {
                                            if (!ignoreConversionErrors) {
                                                throw new Error(`'${name}' expects a number but we got '${value}'`);
                                            }
                                            body[name] = value;
                                        } else {
                                            body[name] = num;
                                        }
                                    } else if (type === 'boolean') {
                                        if (typeof value === 'boolean') {
                                            body[name] = value;
                                        } else {
                                            const strVal = String(value).toLowerCase();
                                            if (strVal === 'true') body[name] = true;
                                            else if (strVal === 'false') body[name] = false;
                                            else {
                                                if (!ignoreConversionErrors) {
                                                    throw new Error(`'${name}' expects a boolean but we got '${value}'`);
                                                }
                                                body[name] = value;
                                            }
                                        }
                                    } else if (type === 'array' || type === 'object') {
                                        if (typeof value === 'object' && value !== null) {
                                            body[name] = value;
                                        } else {
                                            try {
                                                body[name] = JSON.parse(value);
                                            } catch (e) {
                                                if (!ignoreConversionErrors) {
                                                    throw new Error(`'${name}' expects a ${type} but we got '${value}'`);
                                                }
                                                body[name] = value;
                                            }
                                        }
                                    } else {
                                        body[name] = value;
                                    }
                                });
                            }
                        }


                        const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
                        const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');
                        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                            method: 'POST',
                            url: `${baseUrl}/api/odata/businessobject/${objectName}`,
                            body,
                            json: true,
                            skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                        });
                        returnData.push({ json: cleanODataResponse(response) });
                    } else if (operation === 'get') {
                        const recId = this.getNodeParameter('recId', i) as string;
                        const useSelect = this.getNodeParameter('useSelect', i) as boolean;
                        const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
                        const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

                        const qs: IDataObject = {};

                        // Handle select - only if useSelect is enabled
                        if (useSelect) {
                            const selectMode = this.getNodeParameter('selectMode', i) as string;
                            if (selectMode === 'list') {
                                const select = this.getNodeParameter('select', i) as string[];
                                if (select && select.length > 0) {
                                    qs['$select'] = select.join(',');
                                }
                            } else {
                                const selectManual = this.getNodeParameter('selectManual', i) as string;
                                if (selectManual) {
                                    qs['$select'] = selectManual;
                                }
                            }

                            // Workaround: Use collection endpoint with filter because single entity endpoint fails with $select
                            qs['$filter'] = `RecId eq '${recId}'`;

                            const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                                method: 'GET',
                                url: `${baseUrl}/api/odata/businessobject/${objectName}`,
                                qs,
                                json: true,
                                skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                            });

                            if (response.value && Array.isArray(response.value) && response.value.length > 0) {
                                returnData.push({ json: cleanODataResponse(response.value[0]) as IDataObject });
                            } else {
                                throw new Error(`Item with ID '${recId}' not found.`);
                            }
                        } else {
                            // Standard single entity fetch without select
                            const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                                method: 'GET',
                                url: `${baseUrl}/api/odata/businessobject/${objectName}('${recId}')`,
                                qs,
                                json: true,
                                skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                            });
                            returnData.push({ json: cleanODataResponse(response) });
                        }
                    } else if (operation === 'update') {
                        const recId = this.getNodeParameter('recId', i) as string;
                        const mode = this.getNodeParameter('mode', i) as string;
                        let body: IDataObject = {};

                        if (mode === 'json') {
                            body = this.getNodeParameter('body', i) as IDataObject;
                            if (typeof body === 'string') {
                                try {
                                    body = JSON.parse(body);
                                } catch (error) {
                                    throw new Error('Invalid JSON in "JSON" parameter');
                                }
                            }
                        } else {
                            const assignmentsData = this.getNodeParameter('assignments', i) as { assignments: Array<{ name: string; value: any; type?: string }> };
                            const options = this.getNodeParameter('options', i, {}) as IDataObject;
                            const ignoreConversionErrors = options.ignoreConversionErrors as boolean;

                            if (assignmentsData && assignmentsData.assignments) {
                                assignmentsData.assignments.forEach((assignment) => {
                                    const { name, value, type } = assignment;
                                    if (type === 'string') {
                                        body[name] = String(value);
                                    } else if (type === 'number') {
                                        const num = Number(value);
                                        if (isNaN(num)) {
                                            if (!ignoreConversionErrors) {
                                                throw new Error(`'${name}' expects a number but we got '${value}'`);
                                            }
                                            body[name] = value;
                                        } else {
                                            body[name] = num;
                                        }
                                    } else if (type === 'boolean') {
                                        if (typeof value === 'boolean') {
                                            body[name] = value;
                                        } else {
                                            const strVal = String(value).toLowerCase();
                                            if (strVal === 'true') body[name] = true;
                                            else if (strVal === 'false') body[name] = false;
                                            else {
                                                if (!ignoreConversionErrors) {
                                                    throw new Error(`'${name}' expects a boolean but we got '${value}'`);
                                                }
                                                body[name] = value;
                                            }
                                        }
                                    } else if (type === 'array' || type === 'object') {
                                        if (typeof value === 'object' && value !== null) {
                                            body[name] = value;
                                        } else {
                                            try {
                                                body[name] = JSON.parse(value);
                                            } catch (e) {
                                                if (!ignoreConversionErrors) {
                                                    throw new Error(`'${name}' expects a ${type} but we got '${value}'`);
                                                }
                                                body[name] = value;
                                            }
                                        }
                                    } else {
                                        body[name] = value;
                                    }
                                });
                            }
                        }

                        const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
                        const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');
                        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                            method: 'PUT',
                            url: `${baseUrl}/api/odata/businessobject/${objectName}('${recId}')`,
                            body,
                            json: true,
                            skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                        });
                        returnData.push({ json: cleanODataResponse(response) });
                    } else if (operation === 'delete') {
                        const recId = this.getNodeParameter('recId', i) as string;
                        const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
                        const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');
                        await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                            method: 'DELETE',
                            url: `${baseUrl}/api/odata/businessobject/${objectName}('${recId}')`,
                            json: true,
                            skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                        });
                        returnData.push({ json: { success: true, recId } });
                    } else if (operation === 'getAll') {
                        const returnAll = this.getNodeParameter('returnAll', i) as boolean;
                        const options = this.getNodeParameter('options', i) as IDataObject;
                        const useSelect = this.getNodeParameter('useSelect', i) as boolean;
                        const useSort = this.getNodeParameter('useSort', i) as boolean;

                        const qs: IDataObject = {};
                        if (options.filter) {
                            qs['$filter'] = options.filter as string;
                        }

                        // Handle select based on mode - only if useSelect is enabled
                        if (useSelect) {
                            const selectMode = this.getNodeParameter('selectMode', i) as string;
                            if (selectMode === 'list') {
                                const select = this.getNodeParameter('select', i) as string[];
                                if (select && select.length > 0) {
                                    qs['$select'] = select.join(',');
                                }
                            } else {
                                const selectManual = this.getNodeParameter('selectManual', i) as string;
                                if (selectManual) {
                                    qs['$select'] = selectManual;
                                }
                            }
                        }

                        // Handle sort - only if useSort is enabled
                        if (useSort) {
                            const orderByField = this.getNodeParameter('orderByField', i) as string;
                            if (orderByField) {
                                const orderDirection = this.getNodeParameter('orderDirection', i) as string;
                                qs['$orderby'] = `${orderByField} ${orderDirection}`;

                                // Ensure the orderByField is included in the select list if select is used
                                // Some APIs require the sort field to be selected for pagination to work correctly
                                if (qs['$select']) {
                                    const selectFields = (qs['$select'] as string).split(',').map(s => s.trim());
                                    if (!selectFields.includes(orderByField)) {
                                        qs['$select'] += `,${orderByField}`;
                                    }
                                }
                            }
                        }

                        if (returnAll) {
                            let allItems: IDataObject[] = [];
                            let skip = 0;
                            const top = 100; // Batch size
                            let hasMore = true;
                            let pageCount = 0; // Track pages for batching delays

                            // Get pagination delay options
                            const pagesPerBatch = (options.pagesPerBatch as number) !== undefined ? (options.pagesPerBatch as number) : 10;
                            const paginationInterval = (options.paginationInterval as number) !== undefined ? (options.paginationInterval as number) : 100;
                            const shouldDelayPagination = pagesPerBatch !== -1 && paginationInterval > 0;

                            while (hasMore) {
                                const requestQs = { ...qs };
                                requestQs['$skip'] = skip;
                                requestQs['$top'] = top;

                                const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
                                const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');
                                const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                                    method: 'GET',
                                    url: `${baseUrl}/api/odata/businessobject/${objectName}`,
                                    qs: requestQs,
                                    json: true,
                                    skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                                });

                                if (response.value && Array.isArray(response.value)) {
                                    allItems = allItems.concat(response.value as IDataObject[]);
                                    pageCount++;

                                    if (response.value.length < top) {
                                        hasMore = false;
                                    } else {
                                        skip += top;

                                        // Add delay after each batch of pages
                                        if (shouldDelayPagination && pageCount % pagesPerBatch === 0 && hasMore) {
                                            await sleep(paginationInterval);
                                        }
                                    }
                                } else {
                                    hasMore = false;
                                }
                            }

                            allItems.forEach((item) => returnData.push({
                                json: cleanODataResponse(item),
                                pairedItem: {
                                    item: i,
                                },
                            }));
                        } else {
                            const limit = this.getNodeParameter('limit', i) as number;
                            const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
                            const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

                            // Ivanti API supports max 100 records per request, so use pagination if limit > 100
                            if (limit <= 100) {
                                qs['$top'] = limit;
                                const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                                    method: 'GET',
                                    url: `${baseUrl}/api/odata/businessobject/${objectName}`,
                                    qs,
                                    json: true,
                                    skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                                });

                                if (response.value && Array.isArray(response.value)) {
                                    (response.value as IDataObject[]).forEach((item) => returnData.push({
                                        json: cleanODataResponse(item),
                                        pairedItem: {
                                            item: i,
                                        },
                                    }));
                                }
                            } else {
                                // Use pagination to fetch up to limit records
                                let allItems: IDataObject[] = [];
                                let skip = 0;
                                const top = 100; // API max
                                let remaining = limit;
                                let pageCount = 0; // Track pages for batching delays

                                // Get pagination delay options (reuse from earlier)
                                const pagesPerBatch = (options.pagesPerBatch as number) !== undefined ? (options.pagesPerBatch as number) : 10;
                                const paginationInterval = (options.paginationInterval as number) !== undefined ? (options.paginationInterval as number) : 100;
                                const shouldDelayPagination = pagesPerBatch !== -1 && paginationInterval > 0;

                                while (remaining > 0) {
                                    const requestQs = { ...qs };
                                    requestQs['$skip'] = skip;
                                    requestQs['$top'] = Math.min(top, remaining);

                                    const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                                        method: 'GET',
                                        url: `${baseUrl}/api/odata/businessobject/${objectName}`,
                                        qs: requestQs,
                                        json: true,
                                        skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                                    });

                                    if (response.value && Array.isArray(response.value)) {
                                        allItems = allItems.concat(response.value as IDataObject[]);
                                        remaining -= response.value.length;
                                        pageCount++;

                                        // Stop if we got fewer records than requested (no more data available)
                                        if (response.value.length < (requestQs['$top'] as number)) {
                                            break;
                                        }
                                        skip += response.value.length;

                                        // Add delay after each batch of pages
                                        if (shouldDelayPagination && pageCount % pagesPerBatch === 0 && remaining > 0) {
                                            await sleep(paginationInterval);
                                        }
                                    } else {
                                        break;
                                    }
                                }

                                allItems.forEach((item) => returnData.push({
                                    json: cleanODataResponse(item),
                                    pairedItem: {
                                        item: i,
                                    },
                                }));
                            }
                        }
                    }
                } else if (resource === 'attachment') {
                    const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
                    const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');

                    if (operation === 'upload') {
                        const businessObject = this.getNodeParameter('businessObject', i) as string;
                        const recId = this.getNodeParameter('recId', i) as string;
                        const options = this.getNodeParameter('options', i, {}) as IDataObject;
                        const userFileName = options.fileName as string || '';
                        const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
                        const item = items[i];

                        if (item.binary === undefined) {
                            throw new Error('No binary data exists on item!');
                        }

                        const binaryData = item.binary[binaryPropertyName];
                        if (binaryData === undefined) {
                            throw new Error(`No binary data property '${binaryPropertyName}' does not exist on item!`);
                        }

                        // Get credentials for authentication header
                        const credentials = await this.getCredentials('ivantiNeuronsItsmApi');

                        // Use provided fileName or default to original filename from binary data
                        const fileName = userFileName || binaryData.fileName || 'file';

                        // Prepare file buffer from base64 binary data
                        // @ts-ignore
                        const fileBuffer = Buffer.from(binaryData.data, 'base64');

                        // Use FormData from form-data package (same as n8n HTTP Request node)
                        // @ts-ignore
                        const FormData = require('form-data');
                        const formData = new FormData();

                        // Append binary file with Buffer
                        formData.append('file', fileBuffer, {
                            filename: fileName,
                            contentType: binaryData.mimeType || 'application/octet-stream',
                        });

                        // Append required fields per Ivanti API spec
                        formData.append('ObjectID', recId);
                        formData.append('ObjectType', businessObject.toLowerCase() + '#');

                        const response = await this.helpers.httpRequest({
                            method: 'POST',
                            url: `${baseUrl}/api/rest/Attachment`,
                            body: formData,
                            headers: {
                                'Authorization': `rest_api_key=${credentials.apiKey}`,
                            },
                            returnFullResponse: true,
                            skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                        });

                        // Parse response - Ivanti returns array of upload results
                        const responseBody = response.body || [];
                        if (Array.isArray(responseBody) && responseBody.length > 0) {
                            const uploadResult = responseBody[0];
                            returnData.push({
                                json: {
                                    success: uploadResult.IsUploaded || false,
                                    fileName: uploadResult.FileName,
                                    attachmentId: uploadResult.Message,
                                    message: uploadResult.IsUploaded ? 'File uploaded successfully' : uploadResult.Message,
                                }
                            });
                        } else {
                            returnData.push({ json: { success: false, message: 'Unexpected response format', response: responseBody } });
                        }

                    } else if (operation === 'delete') {
                        const recId = this.getNodeParameter('recId', i) as string;
                        await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                            method: 'DELETE',
                            url: `${baseUrl}/api/rest/Attachment/${recId}`,
                            skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                        });
                        returnData.push({ json: { success: true, message: 'Attachment deleted successfully', attachmentId: recId } });

                    } else if (operation === 'get') {
                        const recId = this.getNodeParameter('recId', i) as string;
                        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
                            method: 'GET',
                            url: `${baseUrl}/api/rest/Attachment`,
                            qs: {
                                ID: recId,
                            },
                            encoding: 'arraybuffer',
                            returnFullResponse: true,
                            skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
                        });

                        // Extract binary data - response.body contains the arraybuffer
                        // @ts-ignore
                        let data: Buffer;
                        if (response.body instanceof ArrayBuffer) {
                            // @ts-ignore
                            data = Buffer.from(response.body);
                            // @ts-ignore
                        } else if (Buffer.isBuffer(response.body)) {
                            data = response.body;
                        } else {
                            throw new Error('Unexpected response format for attachment data');
                        }

                        const headers = response.headers || {};

                        let fileName = `attachment_${recId}`;
                        if (headers['content-disposition']) {
                            const contentDisposition = headers['content-disposition'] as string;
                            const match = contentDisposition.match(/filename=\"?([^\"]+)\"?/);
                            if (match && match[1]) {
                                fileName = match[1];
                            }
                        }

                        const newItem: INodeExecutionData = {
                            json: { attachmentId: recId },
                            binary: {
                                data: {
                                    data: data.toString('base64'),
                                    mimeType: (headers['content-type'] as string) || 'application/octet-stream',
                                    fileName,
                                },
                            },
                        };
                        returnData.push(newItem);
                    }
                }
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message } });
                    continue;
                }

                // Extract detailed error message from Ivanti API
                // Check error.context.data (NodeApiError structure)
                const contextData = error.context?.data;
                if (contextData && contextData.code && contextData.message && Array.isArray(contextData.message)) {
                    const description = contextData.description || 'Invalid Request';
                    const messages = contextData.message.join(', ');
                    throw new Error(`Ivanti Error: ${description} - ${messages}`);
                }

                // Check error.response.body (Standard axios/request structure)
                if (error.response && error.response.body) {
                    const data = error.response.body;
                    if (data.code && data.message && Array.isArray(data.message)) {
                        const description = data.description || 'Invalid Request';
                        const messages = data.message.join(', ');
                        throw new Error(`Ivanti Error: ${description} - ${messages}`);
                    }
                }

                throw error;
            }

            // Add delay after each batch (for create/update/delete operations)
            if (shouldBatch && batchInterval > 0 && (i + 1) % effectiveBatchSize === 0 && (i + 1) < items.length) {
                await sleep(batchInterval);
            }
        }

        return [returnData];
    }
}
