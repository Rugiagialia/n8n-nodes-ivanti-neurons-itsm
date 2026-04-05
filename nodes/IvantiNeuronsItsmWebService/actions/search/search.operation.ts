import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
    IDataObject,
    NodeApiError,
    JsonObject,
} from 'n8n-workflow';
import { executeWithSession, IIvantiSession, getWebServiceErrorDetails } from '../common';


export const properties: INodeProperties[] = [
    {
        displayName: 'From Object',
        name: 'fromObject',
        type: 'string',
        default: '',
        required: true,
        description: 'The main business object to search (e.g. Incident)',
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['query'],
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
                resource: ['search'],
                operation: ['query'],
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
                resource: ['search'],
                operation: ['query'],
                returnAll: [false],
            },
        },
    },
    {
        displayName: 'Relationships (Joins)',
        name: 'relationships',
        type: 'fixedCollection',
        default: {},
        typeOptions: {
            multipleValues: true,
        },
        description: 'Add matching object relationships (Many-to-Many support)',
        placeholder: 'Add Relationship',
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['query'],
            },
        },
        options: [
            {
                name: 'relationship',
                displayName: 'Relationship',
                values: [
                    {
                        displayName: 'Relationship Name',
                        name: 'relationshipName',
                        type: 'string',
                        default: '',
                        description: 'The name of the relationship to join (e.g. IncidentAssociatedCustomer)',
                    },
                ],
            },
        ],
    },
    {
        displayName: 'Select Fields',
        name: 'selectFields',
        type: 'string',
        default: '',
        description: 'Comma-separated list of fields to retrieve (e.g. RecId, Subject, CI.Name)',
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['query'],
            },
        },
    },
    {
        displayName: 'Where Clause',
        name: 'whereClause',
        type: 'fixedCollection',
        default: {},
        typeOptions: {
            multipleValues: true,
        },
        placeholder: 'Add Condition',
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['query'],
            },
        },
        options: [
            {
                name: 'rules',
                displayName: 'Rules',
                values: [
                    {
                        displayName: 'Field',
                        name: 'field',
                        type: 'string',
                        default: '',
                        description: 'Field name to filter on',
                    },
                    {
                        displayName: 'Condition',
                        name: 'condition',
                        type: 'options',
                        options: [
                            { name: 'Equals', value: 'eq' },
                            { name: 'Greater Than', value: 'gt' },
                            { name: 'Greater Than or Equal', value: 'gte' },
                            { name: 'In', value: 'in' },
                            { name: 'Is Empty', value: 'isnull' },
                            { name: 'Is Not Empty', value: 'isnotnull' },
                            { name: 'Less Than', value: 'lt' },
                            { name: 'Less Than or Equal', value: 'lte' },
                            { name: 'Like', value: 'like' },
                            { name: 'Not Equals', value: 'neq' },
                            { name: 'Not Like', value: 'notlike' },
                        ],
                        default: 'eq',
                    },
                    {
                        displayName: 'Value',
                        name: 'value',
                        type: 'string',
                        default: '',
                        description: 'Value to compare against. Ignored for Is Empty/Is Not Empty.',
                    },
                    {
                        displayName: 'Join Operator',
                        name: 'join',
                        type: 'options',
                        options: [
                            { name: 'AND', value: 'AND' },
                            { name: 'OR', value: 'OR' },
                        ],
                        default: 'AND',
                        description: 'Operator to join this rule with the previous one',
                    },
                ],
            },
        ],
    },
    {
        displayName: 'Order By',
        name: 'orderBy',
        type: 'fixedCollection',
        default: {},
        typeOptions: {
            multipleValues: true,
        },
        placeholder: 'Add Sort Rule',
        displayOptions: {
            show: {
                resource: ['search'],
                operation: ['query'],
            },
        },
        options: [
            {
                name: 'sort',
                displayName: 'Sort',
                values: [
                    {
                        displayName: 'Field',
                        name: 'field',
                        type: 'string',
                        default: '',
                        description: 'Field to sort by',
                    },
                    {
                        displayName: 'Direction',
                        name: 'direction',
                        type: 'options',
                        options: [
                            { name: 'Ascending', value: 'ASC' },
                            { name: 'Descending', value: 'DESC' },
                        ],
                        default: 'ASC',
                    },
                ],
            },
        ],
    },

];

export async function execute(this: IExecuteFunctions, items: INodeExecutionData[]): Promise<INodeExecutionData[]> {
    return await (executeWithSession.call(this, async (session: IIvantiSession) => {
        const result: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            try {
                const fromObject = this.getNodeParameter('fromObject', i) as string;
                const returnAll = this.getNodeParameter('returnAll', i) as boolean;
                const limit = returnAll ? undefined : this.getNodeParameter('limit', i) as number;

                // Get Relationships (Links)
                const relationCollection = this.getNodeParameter('relationships', i, {}) as IDataObject;
                const relationships = (relationCollection.relationship as IDataObject[]) || [];
                const links = relationships.map(rel => ({
                    RelationshipName: rel.relationshipName as string
                }));

                // Get Select Fields
                const selectFieldsStr = this.getNodeParameter('selectFields', i, '') as string;
                // Allow comma separated string or array
                const fieldNames = selectFieldsStr.split(',').map(f => f.trim()).filter(f => f);

                const selectFields = fieldNames.map(name => ({
                    Name: name
                    // Type is optional, omitted
                }));

                // Get Where Clause
                const whereCollection = this.getNodeParameter('whereClause', i, {}) as IDataObject;
                const whereRules = (whereCollection.rules as IDataObject[]) || [];

                // Map internal condition values to actual operators
                const conditionMap: { [key: string]: string } = {
                    eq: '=',
                    neq: '!=',
                    gt: '>',
                    gte: '>=',
                    lt: '<',
                    lte: '<=',
                    like: 'LIKE',
                    notlike: 'NOT LIKE',
                    in: 'IN',
                    isnull: 'IS NULL',
                    isnotnull: 'IS NOT NULL',
                };

                const whereClause = whereRules.map(rule => ({
                    Join: rule.join || 'AND',
                    Condition: conditionMap[rule.condition as string] || rule.condition,
                    Field: rule.field,
                    Value: rule.value
                }));

                // Get Order By
                const orderCollection = this.getNodeParameter('orderBy', i, {}) as IDataObject;
                const sortRules = (orderCollection.sort as IDataObject[]) || [];

                const orderBy = sortRules.map(rule => ({
                    Name: rule.field as string,
                    Direction: rule.direction as string
                }));

                // Construct Query Object
                const query = {
                    From: {
                        Object: fromObject,
                        Links: links.length > 0 ? links : undefined
                    },
                    Select: {
                        Fields: selectFields.length > 0 ? selectFields : undefined,
                        All: selectFields.length === 0 // If no fields selected, select all
                    },
                    Where: whereClause.length > 0 ? whereClause : undefined,
                    OrderBy: orderBy.length > 0 ? orderBy : undefined,
                    Top: limit || undefined,
                    Skip: undefined
                };

                // The tenantId param in Search web method is just a string separate from sessionKey
                // We'll extract it from the tenantUrl parameter in credentials, stripping http/https
                let tenantIdParam = session.tenantUrl;
                try {
                    // Simple hostname extraction without URL module
                    tenantIdParam = session.tenantUrl.replace(/^https?:\/\//, '').split('/')[0];
                } catch {
                    // fallback
                }

                const payload = {
                    sessionKey: session.sessionKey,
                    tenantId: tenantIdParam,
                    query
                };

                const response = await session.request({
                    endpoint: '/ServiceAPI/FRSHEATIntegration.asmx/Search',
                    method: 'POST',
                    body: payload,
                    headers: {
                        'Cookie': session.cookies.join('; '),
                    },
                });

                // Parse Response
                // Format: { d: { status: "Success", objList: [ [ { FieldValues: [...] } ] ] } }
                // or just { status: ... } depending on endpoint version/wrapping

                // The endpoint is .../FRSHEATIntegration.asmx/Search so it might be wrapped in 'd' or not
                // Usually .asmx/Method returns { d: ... } for JSON

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = (response as any).d ? (response as any).d : response;

                if (data.status === 'Success' && data.objList) {
                    const outerList = data.objList;
                    // objList is List<List<WebServiceBusinessObject>>
                    // Outer list contains multiple business objects matches
                    // Inner list contains joined objects.

                    // We need to flatten this to useful JSON items
                    // Each item in inner list has FieldValues: [{ Name, Value, Type }]

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    outerList.forEach((innerList: any[]) => {
                        const itemJson: IDataObject = {};

                        innerList.forEach(obj => {
                            if (obj.FieldValues) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                obj.FieldValues.forEach((fv: any) => {
                                    itemJson[fv.Name] = fv.Value;
                                });
                            }
                        });

                        result.push({
                            json: itemJson,
                            pairedItem: { item: i },
                        });
                    });

                } else if (data.status === 'Error' || data.exceptionReason) {
                    throw new Error(data.exceptionReason || 'Search failed');
                } else {
                    // Empty or unknown
                    if (data.objList === null) {
                        // No results
                    }
                }

            } catch (error) {
                const { message, description } = getWebServiceErrorDetails(error);

                if (this.continueOnFail()) {
                    result.push({
                        json: {
                            error: message,
                            details: Array.isArray(description) ? description.join('\n') : description,
                        },
                        pairedItem: { item: i },
                    });
                    continue;
                }
                throw new NodeApiError(this.getNode(), error as JsonObject, {
                    message,
                    description: Array.isArray(description) ? description.join('\n') : description,
                });
            }
        }

        return result;
    }) as Promise<INodeExecutionData[]>);
}
