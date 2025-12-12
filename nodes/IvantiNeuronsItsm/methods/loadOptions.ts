import { IDataObject, ILoadOptionsFunctions } from 'n8n-workflow';

export async function getObjectFields(this: ILoadOptionsFunctions) {
    const businessObject = this.getCurrentNodeParameter('businessObject') as string;
    const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
    const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');
    const objectName = `${businessObject}s`;

    try {
        // Fetch one record to get the available fields
        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
            method: 'GET',
            url: `${baseUrl}/api/odata/businessobject/${objectName}`,
            qs: {
                $top: 1,
            },
            json: true,
            skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
        });

        // Extract field names from the first record
        const properties: Array<{ name: string; value: string }> = [];

        if (response.value && Array.isArray(response.value) && response.value.length > 0) {
            const firstRecord = response.value[0];
            const fieldNames = Object.keys(firstRecord);

            fieldNames.forEach((fieldName: string) => {
                properties.push({
                    name: fieldName,
                    value: fieldName,
                });
            });
        } else {
            return [{ name: 'No Records Found to Extract Fields', value: '' }];
        }

        return properties.length > 0 ? properties.sort((a, b) => a.name.localeCompare(b.name)) : [{ name: 'No Fields Found', value: '' }];
    } catch (error) {
        return [{ name: `Error: ${error.message}`, value: '' }];
    }
}

export async function getSavedSearches(this: ILoadOptionsFunctions) {
    const businessObject = this.getCurrentNodeParameter('businessObject') as string;
    const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
    const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');
    const objectName = `${businessObject}s`;

    try {
        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', {
            method: 'GET',
            url: `${baseUrl}/api/odata/${objectName}/$metadata`,
            headers: {
                'Accept': 'application/xml, text/xml, */*',
            },
            json: false,
            skipSslCertificateValidation: credentials.allowUnauthorizedCerts as boolean,
        });

        // Regex to find Functions (Saved Searches) and their ActionId default value
        // Looking for: <Function Name="My_Active"> ... <Parameter Name="ActionId"> ... <PropertyValue Property="DefaultValue" String="..." />
        const functionRegex = /<Function Name="([^"]+)">[\s\S]*?<Parameter Name="ActionId"[\s\S]*?<PropertyValue Property="DefaultValue" String="([^"]+)"/g;

        const matches: Array<{ name: string; value: string }> = [];
        let match;
        while ((match = functionRegex.exec(response)) !== null) {
            matches.push({
                name: match[1].replace(/_/g, ' '), // Replace underscores with spaces for display
                value: `${match[1]}|${match[2]}`, // Store Name|ActionId
            });
        }

        return matches.length > 0
            ? matches.sort((a, b) => a.name.localeCompare(b.name))
            : [{ name: 'No Saved Searches Found', value: '' }];

    } catch (error) {
        return [{ name: `Error: ${error.message}`, value: '' }];
    }
}

export async function getEmployees(this: ILoadOptionsFunctions, filter?: string) {
    const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
    const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');
    const allowUnauthorizedCerts = credentials.allowUnauthorizedCerts as boolean;
    const query = filter || '';

    try {
        const qs: { [key: string]: any } = {
            $select: 'RecId,DisplayName',
            $top: 20,
        };

        if (query) {
            qs.$search = query;
        }

        const options = {
            method: 'GET' as const,
            url: `${baseUrl}/api/odata/businessobject/Frs_CompositeContract_Contacts`,
            qs,
            json: true,
            skipSslCertificateValidation: allowUnauthorizedCerts,
        };

        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', options);
        const items = response.value || [];

        return {
            results: items.map((item: any) => ({
                name: item.DisplayName || item.RecId,
                value: item.RecId,
            })),
        };


    } catch (error) {
        return {
            results: [{ name: `Error: ${error.message}`, value: '' }],
        };
    }
}

export async function getSubscriptions(this: ILoadOptionsFunctions, filter?: string) {
    const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
    const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');
    const allowUnauthorizedCerts = credentials.allowUnauthorizedCerts as boolean;
    const strUserIdValue = this.getCurrentNodeParameter('strUserId') as IDataObject;
    const strUserId = (strUserIdValue?.value || strUserIdValue) as string;
    const query = (filter || '').toLowerCase();

    if (!strUserId) {
        return { results: [] };
    }

    try {
        const options = {
            method: 'GET' as const,
            url: `${baseUrl}/api/rest/Template/${strUserId}/_All_`,
            json: true,
            skipSslCertificateValidation: allowUnauthorizedCerts,
        };

        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', options);
        // Response is array of objects directly
        const items = response || [];

        const results = items
            .filter((item: any) => !query || (item.strName && item.strName.toLowerCase().includes(query)))
            .map((item: any) => ({
                name: item.strName,
                value: item.strSubscriptionId,
            }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));

        return { results };

    } catch (error) {
        return {
            results: [{ name: `Error: ${error.message}`, value: '' }],
        };
    }
}
