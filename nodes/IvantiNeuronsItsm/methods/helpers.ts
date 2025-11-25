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
        // @ts-expect-error - setTimeout types are correct
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
        let data = error.context.data;

        // If data is a Buffer-like object (has numeric keys) or has type/data properties
        const keys = Object.keys(data);
        const isBufferLike = keys.length > 0 && keys.every((k, i) => k === i.toString());
        const hasBufferStructure = data.type === 'Buffer' && Array.isArray(data.data);

        if (isBufferLike || hasBufferStructure) {
            try {
                // Convert to byte array
                let byteArray: number[];
                if (isBufferLike) {
                    // Keys are '0', '1', '2', etc - convert to array
                    byteArray = keys.map(k => data[k]);
                } else {
                    // Has data.data property
                    byteArray = data.data;
                }

                // Convert byte array to string
                const dataStr = String.fromCharCode.apply(null, byteArray as number[]);
                data = JSON.parse(dataStr);
            } catch {
                // If parsing fails, keep as-is
            }
        }

        // Use the code/description as the main message
        if (data.description) {
            message = data.description;
        } else if (data.code) {
            message = `Error ${data.code}`;
        }

        // Extract from data.message - prioritize this over generic error.description
        if (data.message) {
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
        let body = error.response.body;

        // If body is a string or looks like a buffer, try to parse it as JSON
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch {
                // If parsing fails, keep as-is
            }
        } else if (body && typeof body === 'object' && typeof body.toString === 'function' && body.constructor && body.constructor.name === 'Buffer') {
            try {
                const bodyStr = body.toString('utf-8');
                body = JSON.parse(bodyStr);
            } catch {
                // If parsing fails, keep as-is
            }
        }

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
        // Standard Ivanti error format: { "code": "...", "description": "...", "message": [...] }
        else if (body.code || body.description || body.message) {
            if (body.description) {
                message = body.description;
            } else if (body.code) {
                message = `Error ${body.code}`;
            }


            if (!description && body.message) {
                if (Array.isArray(body.message)) {
                    description = body.message.map((m: any) =>
                        typeof m === 'string' ? m : JSON.stringify(m)
                    );
                } else {
                    description = typeof body.message === 'string'
                        ? body.message
                        : JSON.stringify(body.message);
                }
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
