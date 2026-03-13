import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as localization from './localization';
import * as search from './search';

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    if (resource === 'localization') {
        // @ts-expect-error - Dynamic operation execution
        const responseData = await localization[operation].execute.call(this, items);
        return [responseData];
    }

    if (resource === 'search') {
        const responseData = await search.query.execute.call(this, items);
        return [responseData];
    }

    // Fallback
    const initialData = items.map((item) => ({
        ...item,
        json: { ...item.json, resource, operation },
    }));
    return [initialData];
}
