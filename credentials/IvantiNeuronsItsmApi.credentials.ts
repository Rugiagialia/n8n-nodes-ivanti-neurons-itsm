import {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
    Icon,
} from 'n8n-workflow';

export class IvantiNeuronsItsmApi implements ICredentialType {
    name = 'ivantiNeuronsItsmApi';
    displayName = 'Ivanti Neurons for ITSM API';
    documentationUrl = 'https://help.ivanti.com/ht/help/en_US/ISM/2017.3/Content/Configure/API/Authentication.htm';
    icon: Icon = 'node:n8n-nodes-ivanti-neurons-itsm.ivantiNeuronsItsm';
    properties: INodeProperties[] = [
        {
            displayName: 'Tenant URL',
            name: 'tenantUrl',
            type: 'string',
            default: '',
            placeholder: 'https://example.ivanticloud.com',
        },
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
        },
        {
            displayName: 'Ignore SSL Issues',
            name: 'allowUnauthorizedCerts',
            type: 'boolean',
            default: false,
            description: 'Whether to connect even if SSL certificate validation is not possible (e.g. self-signed certificate)',
            typeOptions: { password: true },
        },
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                Authorization: '={{ "rest_api_key=" + $credentials.apiKey }}',
            },
        },
    };

    test: ICredentialTestRequest = {
        request: {
            baseURL: '={{$credentials.tenantUrl}}',
            url: '/api/odata/businessobject/incidents',
            method: 'GET',
            qs: {
                $top: 1,
            },
            skipSslCertificateValidation: '={{$credentials.allowUnauthorizedCerts}}',
        },
    };
}
