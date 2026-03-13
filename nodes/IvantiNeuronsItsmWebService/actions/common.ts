import {
    IExecuteFunctions,
    IDataObject,
    NodeOperationError,
} from 'n8n-workflow';


export interface IIvantiSession {
    cookies: string[];
    csrfToken: string;
    tenantUrl: string;
    sessionKey: string;
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

export interface IAuthResponseData {
    Authenticated: boolean;
    SessionCsrfToken?: string;
    SessionKey?: string;
    InternalMessage?: string;
}

export interface IAuthResponse {
    d: IAuthResponseData;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getWebServiceErrorDetails = (error: any): IvantiWebServiceErrorDetails => {
    let message = 'Request failed';
    let description: string | string[] | undefined = undefined;

    // Web Service errors come in error.message as: "500 - {JSON...}"
    // We need to extract and parse that JSON
    if (error.message && typeof error.message === 'string') {
        // Try to extract JSON from error.message (format: "500 - {...}")
        const match = (error.message as string).match(/^\d{3}\s*-\s*(.+)$/);
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
                            description = logEntry.Exception as string;
                        }
                    } catch {
                        // Ignore JSON parse errors for LogEntryId
                    }
                }

                // Fallback to InternalMessage if no description yet
                if (!description && errorData.InternalMessage) {
                    description = errorData.InternalMessage as string;
                }

                return { message, description };
            } catch {
                // If JSON parsing fails, use the whole message as description
                description = error.message as string;
                return { message, description };
            }
        }
    }

    // Fallback: Check for n8n NodeApiError description
    if (error.description) {
        description = Array.isArray(error.description)
            ? error.description as string[]
            : [error.description as string];
    }

    // Fallback: Check for context data from Ivanti Web Service
    if (!description && error.context && error.context.data) {
        let data = error.context.data;

        // If data is a Buffer-like object (has numeric keys) or has type/data properties
        const keys = Object.keys(data as object);
        const isBufferLike = keys.length > 0 && keys.every((k, i) => k === i.toString());
        const hasBufferStructure = data.type === 'Buffer' && Array.isArray(data.data);

        if (isBufferLike || hasBufferStructure) {
            try {
                let byteArray: number[];
                if (isBufferLike) {
                    byteArray = keys.map(k => (data as IDataObject)[k] as number);
                } else {
                    byteArray = data.data as number[];
                }
                const dataStr = String.fromCharCode.apply(null, byteArray);
                data = JSON.parse(dataStr);
            } catch {
                // If parsing fails, keep as-is
            }
        }

        if ((data as IDataObject).Message) {
            message = (data as IDataObject).Message as string;
        }
        if ((data as IDataObject).LogEntryId) {
            try {
                const logEntry = typeof (data as IDataObject).LogEntryId === 'string'
                    ? JSON.parse((data as IDataObject).LogEntryId as string)
                    : (data as IDataObject).LogEntryId;
                if (logEntry.Exception) {
                    description = logEntry.Exception as string;
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
                description = body as string;
                return { message, description };
            }
        }

        if ((body as IDataObject).Message) {
            message = (body as IDataObject).Message as string;
        }
        if ((body as IDataObject).LogEntryId) {
            try {
                const logEntry = typeof (body as IDataObject).LogEntryId === 'string'
                    ? JSON.parse((body as IDataObject).LogEntryId as string)
                    : (body as IDataObject).LogEntryId;
                if (logEntry.Exception) {
                    description = logEntry.Exception as string;
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
        description = error.message as string;
    }

    return { message, description };
};


export async function executeWithSession(
    this: IExecuteFunctions,
    callback: (session: IIvantiSession) => Promise<unknown>,
): Promise<unknown> {
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
        const options = {
            method,
            url: `${tenantUrl}${endpoint}`,
            body,
            headers,
            rejectUnauthorized: !allowUnauthorizedCerts,
            returnFullResponse: true,
        };
        // @ts-expect-error - options are correct
        return await this.helpers.httpRequest(options);
    };

    let cookies: string[] = [];
    let csrfToken = '';
    let sessionKey = '';

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

        if (authResponse.body && (authResponse.body as IAuthResponse).d) {
            const data = (authResponse.body as IAuthResponse).d;
            if (data.SessionCsrfToken) {
                csrfToken = data.SessionCsrfToken;
            }
            if (data.SessionKey) {
                sessionKey = data.SessionKey;
            }
        }

        if (!(authResponse.body as IAuthResponse).d.Authenticated) {
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

        if (roleResponse.body && (roleResponse.body as IAuthResponse).d) {
            const data = (roleResponse.body as IAuthResponse).d;
            if (data.SessionCsrfToken) {
                csrfToken = data.SessionCsrfToken;
            }
            if (data.SessionKey) {
                sessionKey = data.SessionKey;
            }
        }

    } catch (error) {
        // Attempt logout if role selection fails
        try {
            await makeRequest('/Services/Session.asmx/Logout', 'POST', { _csrfToken: csrfToken }, { 'Cookie': cookies.join('; ') });
        } catch {
            // Ignore logout error
        }
        throw new NodeOperationError(this.getNode(), 'Role selection failed', { description: error.message });
    }

    const session: IIvantiSession = {
        cookies,
        csrfToken,
        tenantUrl,
        sessionKey,
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
        } catch {
            // We don't want to fail the execution if logout fails
        }
    }
}
