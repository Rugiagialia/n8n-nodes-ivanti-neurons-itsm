import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as businessObject from './businessObject';
import * as relationship from './relationship';
import * as attachment from './attachment';
import * as search from './search';

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

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

    if (resource === 'businessObject') {
        // @ts-ignore
        return [await businessObject[operation].execute.call(this, items)];
    }

    if (resource === 'relationship') {
        // @ts-ignore
        return [await relationship[operation].execute.call(this, items)];
    }

    if (resource === 'attachment') {
        // @ts-ignore
        return [await attachment[operation].execute.call(this, items)];
    }

    if (resource === 'search') {
        // @ts-ignore
        return [await search[operation].execute.call(this, items)];
    }

    return [initialData];
}
