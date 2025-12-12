import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import * as businessObject from './businessObject';
import * as relationship from './relationship';
import * as attachment from './attachment';
import * as search from './search';
import * as serviceRequest from './serviceRequest';

// Helper function to recursively remove null values from objects
function stripNullValues(obj: IDataObject): IDataObject {
    const result: IDataObject = {};

    for (const key in obj) {
        if (obj[key] === null) {
            continue; // Skip null values
        }

        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            // Recursively process nested objects
            result[key] = stripNullValues(obj[key] as IDataObject);
        } else {
            // Keep non-null values
            result[key] = obj[key];
        }
    }

    return result;
}

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;
    const options = this.getNodeParameter('options', 0, {}) as IDataObject;
    const stripNull = options.stripNull as boolean || false;

    const ivantiNeuronsItsmNodeData = {
        resource,
        operation,
    } as {
        resource: string;
        operation: string;
    };

    const initialData = items.map((item) => ({
        ...item,
        json: { ...item.json, ...ivantiNeuronsItsmNodeData },
    }));

    let result: INodeExecutionData[];

    if (resource === 'businessObject') {
        // @ts-expect-error - Dynamic operation execution
        result = await businessObject[operation].execute.call(this, items);
    } else if (resource === 'relationship') {
        // @ts-expect-error - Dynamic operation execution
        result = await relationship[operation].execute.call(this, items);
    } else if (resource === 'attachment') {
        // @ts-expect-error - Dynamic operation execution
        result = await attachment[operation].execute.call(this, items);
    } else if (resource === 'search') {
        // @ts-expect-error - Dynamic operation execution
        result = await search[operation].execute.call(this, items);
    } else if (resource === 'serviceRequest') {
        // @ts-expect-error - Dynamic operation execution
        result = await serviceRequest[operation].execute.call(this, items);
    } else {
        result = initialData;
    }

    // Apply stripNull if enabled
    if (stripNull && result) {
        result = result.map((item) => ({
            ...item,
            json: stripNullValues(item.json as IDataObject),
        }));
    }

    return [result];
}
