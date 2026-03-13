import {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class IvantiNeuronsItsmWebServiceApi implements ICredentialType {
    name = 'ivantiNeuronsItsmWebServiceApi';
    displayName = 'Ivanti Neurons for ITSM (Web Service) API';
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @n8n/community-nodes/icon-validation
    icon = 'node:n8n-nodes-ivanti-neurons-itsm.ivantiNeuronsItsmWebService';
    documentationUrl = 'https://help.ivanti.com/ht/help/en_US/ISM/2022/admin/Content/Configure/API/RestAPI-Introduction.htm';
    properties: INodeProperties[] = [
        {
            displayName: 'Tenant URL',
            name: 'tenantUrl',
            type: 'string',
            default: '',
            placeholder: 'https://example.ivanticloud.com/HEAT',
            required: true,
        },
        {
            displayName: 'App ID',
            name: 'appId',
            type: 'string',
            default: '',
            description: 'Optional. Override the App ID if it differs from the Tenant URL hostname (e.g. when using a reverse proxy).',
        },
        {
            displayName: 'Timezone Offset',
            name: 'tzoffset',
            type: 'number',
            default: 0,
            description: 'The timezone offset in minutes (e.g. 0 for UTC, -180 for GMT+3).',
            required: true,
        },
        {
            displayName: 'Timezone Name',
            name: 'timezoneName',
            type: 'string',
            default: 'UTC',
            description: 'The timezone name (e.g. UTC, Europe/Vilnius).',
            required: true,
        },
        {
            displayName: 'Username',
            name: 'username',
            type: 'string',
            default: '',
            required: true,
        },
        {
            displayName: 'Password',
            name: 'password',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
            required: true,
        },
        {
            displayName: 'Role',
            name: 'role',
            type: 'string',
            default: 'Admin',
            description: 'The role to use for the session (e.g. Admin, ServiceDeskAnalyst)',
            required: true,
        },
        // eslint-disable-next-line @n8n/community-nodes/credential-password-field
        {
            displayName: 'Ignore SSL Issues',
            name: 'allowUnauthorizedCerts',
            type: 'boolean',
            default: false,
            description: 'Whether to connect even if SSL certificate validation is not possible (e.g. self-signed certificate)',
        },
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            // This credential type is used for session-based auth, so no default header injection here.
            // The node itself will handle the session flow using these credentials.
        },
    };

    test: ICredentialTestRequest = {
        request: {
            baseURL: '={{$credentials.tenantUrl}}',
            url: '/Services/Session.asmx/Authorize',
            method: 'POST',
            body: {
                AppId: '={{ $credentials.appId || $credentials.tenantUrl.replace(/^https?:\\/\\//i, "").split("/")[0].split(":")[0] }}',
                Username: '={{$credentials.username}}',
                Password: '={{$credentials.password}}',
                tzoffset: '={{$credentials.tzoffset || 0}}',
                timezoneName: '={{$credentials.timezoneName || "UTC"}}',
            },
            skipSslCertificateValidation: '={{$credentials.allowUnauthorizedCerts}}',
        },
    };
}
