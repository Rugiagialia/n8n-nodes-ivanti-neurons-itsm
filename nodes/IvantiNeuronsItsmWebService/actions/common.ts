import {
    IExecuteFunctions,
    IDataObject,
    NodeOperationError,
} from 'n8n-workflow';


export interface IIvantiSession {
    cookies: string[];
    csrfToken: string;
    tenantUrl: string;
}

export const sleep = async (ms: number): Promise<void> => {
    if (ms <= 0) return;
    return new Promise<void>((resolve) => {
        // @ts-expect-error - setTimeout types are correct
        setTimeout(resolve, ms);
    });
};

export interface IvantiWebServiceErrorDetails {
    message: string;
    description?: string | string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getWebServiceErrorDetails = (error: any): IvantiWebServiceErrorDetails => {
    let message = 'Request failed';
    let description: string | string[] | undefined = undefined;

    // Web Service errors come in error.message as: "500 - {JSON...}"
    // We need to extract and parse that JSON
    if (error.message && typeof error.message === 'string') {
        // Try to extract JSON from error.message (format: "500 - {...}")
        const match = error.message.match(/^\d{3}\s*-\s*(.+)$/);
        if (match && match[1]) {
            try {
                const errorData = JSON.parse(match[1]);

                // Web Service error format: { "ErrorCode": "...", "Message": "...", "ExceptionType": "...", "LogEntryId": "{...}" }
                if (errorData.Message) {
                    message = errorData.Message;
                } else if (errorData.ExceptionType) {
                    message = errorData.ExceptionType;
                } else if (errorData.ErrorCode) {
                    message = errorData.ErrorCode;
                }

                // Extract exception details from LogEntryId if available
                if (errorData.LogEntryId) {
                    try {
                        const logEntry = typeof errorData.LogEntryId === 'string'
                            ? JSON.parse(errorData.LogEntryId)
                            : errorData.LogEntryId;
                        if (logEntry.Exception) {
                            description = logEntry.Exception;
                        }
                    } catch {
                        // Ignore JSON parse errors for LogEntryId
                    }
                }

                // Fallback to InternalMessage if no description yet
                if (!description && errorData.InternalMessage) {
                    description = errorData.InternalMessage;
                }

                return { message, description };
            } catch {
                // If JSON parsing fails, use the whole message as description
                description = error.message;
                return { message, description };
            }
        }
    }

    // Fallback: Check for n8n NodeApiError description
    if (error.description) {
        description = Array.isArray(error.description)
            ? error.description
            : [error.description];
    }

    // Fallback: Check for context data from Ivanti Web Service
    if (!description && error.context && error.context.data) {
        let data = error.context.data;

        // If data is a Buffer-like object (has numeric keys) or has type/data properties
        const keys = Object.keys(data);
        const isBufferLike = keys.length > 0 && keys.every((k, i) => k === i.toString());
        const hasBufferStructure = data.type === 'Buffer' && Array.isArray(data.data);

        if (isBufferLike || hasBufferStructure) {
            try {
                let byteArray: number[];
                if (isBufferLike) {
                    byteArray = keys.map(k => data[k]);
                } else {
                    byteArray = data.data;
                }
                const dataStr = String.fromCharCode.apply(null, byteArray as number[]);
                data = JSON.parse(dataStr);
            } catch {
                // If parsing fails, keep as-is
            }
        }

        if (data.Message) {
            message = data.Message;
        }
        if (data.LogEntryId) {
            try {
                const logEntry = typeof data.LogEntryId === 'string'
                    ? JSON.parse(data.LogEntryId)
                    : data.LogEntryId;
                if (logEntry.Exception) {
                    description = logEntry.Exception;
                }
            } catch {
                // Ignore
            }
        }
    }

    // Fallback: Check raw response body
    if (!description && error.response && error.response.body) {
        let body = error.response.body;

        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch {
                description = body;
                return { message, description };
            }
        }

        if (body.Message) {
            message = body.Message;
        }
        if (body.LogEntryId) {
            try {
                const logEntry = typeof body.LogEntryId === 'string'
                    ? JSON.parse(body.LogEntryId)
                    : body.LogEntryId;
                if (logEntry.Exception) {
                    description = logEntry.Exception;
                }
            } catch {
                // Ignore
            }
        }
        if (!description && typeof body === 'object') {
            description = JSON.stringify(body);
        }
    }

    // Final fallback to error.message
    if (!description && error.message) {
        description = error.message;
    }

    return { message, description };
};


export async function executeWithSession(
    this: IExecuteFunctions,
    callback: (session: IIvantiSession) => Promise<any>,
): Promise<any> {
    const credentials = await this.getCredentials('ivantiNeuronsItsmWebServiceApi');

    if (!credentials) {
        throw new NodeOperationError(this.getNode(), 'No credentials found!');
    }

    const tenantUrl = (credentials.tenantUrl as string).replace(/\/$/, ''); // Remove trailing slash
    const username = credentials.username as string;
    const password = credentials.password as string;
    const role = credentials.role as string;
    const allowUnauthorizedCerts = credentials.allowUnauthorizedCerts as boolean;

    // Helper to make requests
    const makeRequest = async (endpoint: string, method: string, body: IDataObject, headers: IDataObject = {}) => {
        const options: IDataObject = {
            method,
            uri: `${tenantUrl}${endpoint}`,
            body,
            json: true,
            headers,
            rejectUnauthorized: !allowUnauthorizedCerts,
            resolveWithFullResponse: true,
        };
        return await this.helpers.request(options);
    };

    let cookies: string[] = [];
    let csrfToken = '';

    // 1. Authorize
    try {
        // Use provided appId or extract from tenantUrl
        const appId = (credentials.appId as string) || tenantUrl.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];

        const authBody = {
            AppId: appId,
            Username: username,
            Password: password,
            tzoffset: 0,
            timezoneName: 'UTC', // Defaulting to UTC
        };

        const authResponse = await makeRequest('/Services/Session.asmx/Authorize', 'POST', authBody);

        if (authResponse.headers['set-cookie']) {
            cookies = authResponse.headers['set-cookie'] as string[];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (authResponse.body && (authResponse.body as any).d && (authResponse.body as any).d.SessionCsrfToken) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            csrfToken = (authResponse.body as any).d.SessionCsrfToken;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(authResponse.body as any).d.Authenticated) {
            throw new NodeOperationError(this.getNode(), 'Authentication failed: ' + JSON.stringify(authResponse.body));
        }

    } catch (error) {
        const usedAppId = (credentials.appId as string) || tenantUrl.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
        throw new NodeOperationError(this.getNode(), `Login failed for AppId '${usedAppId}'`, { description: error.message });
    }

    // 2. Select Role
    try {
        const roleBody = {
            sRole: role,
            _csrfToken: csrfToken,
        };

        const headers = {
            'Cookie': cookies.join('; '),
        };

        const roleResponse = await makeRequest('/Services/Session.asmx/SelectRole', 'POST', roleBody, headers);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (roleResponse.body && (roleResponse.body as any).d && (roleResponse.body as any).d.SessionCsrfToken) {
            // Update CSRF token if changed (though usually stays same)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            csrfToken = (roleResponse.body as any).d.SessionCsrfToken;
        }

    } catch (error) {
        // Attempt logout if role selection fails
        try {
            await makeRequest('/Services/Session.asmx/Logout', 'POST', { _csrfToken: csrfToken }, { 'Cookie': cookies.join('; ') });
        } catch (logoutError) {
            // Ignore logout error
        }
        throw new NodeOperationError(this.getNode(), 'Role selection failed', { description: error.message });
    }

    const session: IIvantiSession = {
        cookies,
        csrfToken,
        tenantUrl,
    };

    // 3. Execute Callback (The main action)
    try {
        return await callback(session);
    } finally {
        // 4. Logout (Always execute in finally block)
        try {
            const logoutBody = {
                _csrfToken: csrfToken,
            };
            const headers = {
                'Cookie': cookies.join('; '),
            };
            await makeRequest('/Services/Session.asmx/Logout', 'POST', logoutBody, headers);
        } catch (error) {
            // We don't want to fail the execution if logout fails, but maybe log it?
            // n8n doesn't have a standard logger exposed here easily, keeping silent as per practice.
        }
    }
}
