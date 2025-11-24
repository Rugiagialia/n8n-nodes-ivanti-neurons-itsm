import { IDataObject } from 'n8n-workflow';

export const cleanODataResponse = (data: any): any => {
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

export const sleep = async (ms: number): Promise<void> => {
    if (ms <= 0) return;
    return new Promise<void>((resolve) => {
        // @ts-ignore
        setTimeout(resolve, ms);
    });
};

export interface IvantiErrorDetails {
    message: string;
    description?: string | string[];
}

export const getIvantiErrorDetails = (error: any): IvantiErrorDetails => {
    let message = 'Request failed';
    let description: string | string[] | undefined = undefined;

    // Check for n8n NodeApiError description (often contains the detailed error from the service)
    if (error.description) {
        // Use description as the detailed error
        description = Array.isArray(error.description)
            ? error.description
            : [error.description];
    }

    // Check for context data from Ivanti (e.g. ISM_4000)
    if (error.context && error.context.data) {
        const data = error.context.data;

        // Use the code/description as the main message
        if (data.description) {
            message = data.description;
        } else if (data.code) {
            message = `Error ${data.code}`;
        }

        // If we don't have description yet, extract from data.message
        if (!description && data.message) {
            if (Array.isArray(data.message)) {
                description = data.message.map((m: any) =>
                    typeof m === 'string' ? m : JSON.stringify(m)
                );
            } else {
                description = typeof data.message === 'string'
                    ? data.message
                    : JSON.stringify(data.message);
            }
        }
    }

    // Check raw response body
    if (error.response && error.response.body) {
        const body = error.response.body;

        // OData error format: { "error": { "code": "...", "message": { "lang": "en-US", "value": "..." } } }
        if (body.error && body.error.message && body.error.message.value) {
            if (!description) {
                description = body.error.message.value;
            }
            message = body.error.code || message;
        }
        // Alternative OData format: { "error": { "code": "...", "message": "..." } }
        else if (body.error && body.error.message) {
            if (!description) {
                description = typeof body.error.message === 'string'
                    ? body.error.message
                    : JSON.stringify(body.error.message);
            }
            message = body.error.code || message;
        }
        // Simple error format: { "Message": "..." }
        else if (body.Message) {
            if (!description) {
                description = body.Message;
            }
        }
        // Fallback to stringified body if it's an object
        else if (typeof body === 'object' && !description) {
            description = JSON.stringify(body);
        }
    }

    // Fallback to error.message if we still don't have anything
    if (!description && error.message) {
        description = error.message;
    }

    return { message, description };
};

// Backward compatibility: simple error message extractor
export const getErrorMessage = (error: any): string => {
    const { message, description } = getIvantiErrorDetails(error);
    if (description) {
        if (Array.isArray(description)) {
            return description.join('; ');
        }
        return description;
    }
    return message;
};
