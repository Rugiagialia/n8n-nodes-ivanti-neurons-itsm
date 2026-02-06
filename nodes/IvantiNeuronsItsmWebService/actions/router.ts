import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as localization from './localization';

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    const ivantiValidationNodeData = {
        resource,
        operation,
    } as {
        resource: string;
        operation: string;
    };

    const initialData = items.map((item) => ({
        ...item,
        json: { ...item.json, ...ivantiValidationNodeData },
    }));

    if (resource === 'localization') {
        // @ts-expect-error - Dynamic operation execution
        const responseData = await localization[operation].execute.call(this, items);
        return [responseData];
    }

    return [initialData];
}
