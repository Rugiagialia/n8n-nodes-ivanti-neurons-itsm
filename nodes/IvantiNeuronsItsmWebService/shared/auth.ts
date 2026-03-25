import { IDataObject } from 'n8n-workflow';

export const DEFAULT_WEB_SERVICE_TZOFFSET = 0;
export const DEFAULT_WEB_SERVICE_TIMEZONE_NAME = 'UTC';

export interface IWebServiceAuthorizeCredentialsLike {
    appId?: unknown;
}

export interface IWebServiceAuthorizeBody extends IDataObject {
    AppId: string;
    Username: string;
    Password: string;
    tzoffset: number;
    timezoneName: string;
}

const getTenantHostname = (tenantUrl: string): string =>
    tenantUrl.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];

export const resolveWebServiceAppId = (
    tenantUrl: string,
    appId?: unknown,
): string => {
    if (typeof appId === 'string' && appId.trim() !== '') {
        return appId;
    }

    return getTenantHostname(tenantUrl);
};

export const buildWebServiceAuthorizeBody = ({
    tenantUrl,
    credentialsLike,
    username,
    password,
}: {
    tenantUrl: string;
    credentialsLike: IWebServiceAuthorizeCredentialsLike;
    username: string;
    password: string;
}): IWebServiceAuthorizeBody => {
    return {
        AppId: resolveWebServiceAppId(tenantUrl, credentialsLike.appId),
        Username: username,
        Password: password,
        tzoffset: DEFAULT_WEB_SERVICE_TZOFFSET,
        timezoneName: DEFAULT_WEB_SERVICE_TIMEZONE_NAME,
    };
};
