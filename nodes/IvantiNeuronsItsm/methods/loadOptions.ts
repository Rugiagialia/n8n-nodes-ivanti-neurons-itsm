import { IDataObject, ILoadOptionsFunctions } from 'n8n-workflow';

export async function getObjectFields(this: ILoadOptionsFunctions, params?: IDataObject) {
    let businessObject = this.getCurrentNodeParameter('businessObject') as string;

    if (!businessObject) {
        if (params?.businessObject) {
            businessObject = params.businessObject as string;
        } else {
            // Fallback for Service Request where BO param doesn't exist
            try {
                const resource = this.getCurrentNodeParameter('resource') as string;
                if (resource === 'serviceRequest') {
                    businessObject = 'ServiceReqParam';
                }
            } catch (error) {
                // ignore
            }
        }
    }

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
        const qs: IDataObject = {
            $select: 'RecId,DisplayName,EmployeeLocation',
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
            results: items.map((item: IDataObject) => ({
                name: (item.DisplayName || item.RecId) as string,
                value: item.EmployeeLocation ? `${item.RecId}|${item.EmployeeLocation}` : item.RecId as string,
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
            .filter((item: IDataObject) => !query || ((item.strName as string) && (item.strName as string).toLowerCase().includes(query)))
            .map((item: IDataObject) => ({
                name: item.strName as string,
                value: `${item.strSubscriptionId}|${item.strRecId}`,
            }))
            .sort((a: IDataObject, b: IDataObject) => (a.name as string).localeCompare(b.name as string));

        return { results };

    } catch (error) {
        return {
            results: [{ name: `Error: ${error.message}`, value: '' }],
        };
    }
}
export async function getSubscriptionParameters(this: ILoadOptionsFunctions) {
    const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
    const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');
    const allowUnauthorizedCerts = credentials.allowUnauthorizedCerts as boolean;
    const subscriptionIdValue = this.getCurrentNodeParameter('subscriptionId') as IDataObject;
    const rawSubscriptionId = (subscriptionIdValue?.value || subscriptionIdValue) as string;

    // Split "SubscriptionID|TemplateRecID" if applicable, otherwise use as is (backward compat)
    let templateRecId = rawSubscriptionId;
    if (rawSubscriptionId && typeof rawSubscriptionId === 'string' && rawSubscriptionId.includes('|')) {
        const parts = rawSubscriptionId.split('|');
        if (parts.length > 1) {
            templateRecId = parts[1]; // Use the strRecId (Template ID) for filtering
        }
    }

    if (!templateRecId) {
        return [];
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const returnItems: any[] = [];
        let skip = 0;
        let moreItems = true;
        const top = 100;

        while (moreItems) {
            const options = {
                method: 'GET' as const,
                url: `${baseUrl}/api/odata/businessobject/ServiceReqTemplateParams`,
                qs: {
                    $filter: `ParentLink_RecID eq '${templateRecId}'`,
                    $select: 'RecId,DisplayName,DisplayType,Name',
                    $top: top,
                    $skip: skip,
                },
                json: true,
                skipSslCertificateValidation: allowUnauthorizedCerts,
            };

            const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', options);
            const items = response.value || [];

            if (items.length > 0) {
                returnItems.push(...items);
                skip += top;
            } else {
                moreItems = false;
            }

            if (items.length < top) {
                moreItems = false;
            }
        }

        const results = returnItems
            .map((item: IDataObject) => ({
                name: `${item.DisplayName} (${item.DisplayType})`,
                value: item.RecId as string,
            }))
            .sort((a: IDataObject, b: IDataObject) => (a.name as string).localeCompare(b.name as string));

        return results;

    } catch (error) {
        return [
            { name: `Error: ${error.message}`, value: '' },
        ];
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSubscriptionParametersSchema(this: ILoadOptionsFunctions): Promise<{ fields: any[] }> {
    const credentials = await this.getCredentials('ivantiNeuronsItsmApi');
    const baseUrl = (credentials.tenantUrl as string).replace(/\/$/, '');
    const allowUnauthorizedCerts = credentials.allowUnauthorizedCerts as boolean;

    const subscriptionIdValue = this.getCurrentNodeParameter('subscriptionId') as IDataObject;
    const rawSubscriptionId = (subscriptionIdValue?.value || subscriptionIdValue) as string;

    // Split "SubscriptionID|TemplateRecID" if applicable
    let templateRecId = rawSubscriptionId;
    if (rawSubscriptionId && typeof rawSubscriptionId === 'string' && rawSubscriptionId.includes('|')) {
        const parts = rawSubscriptionId.split('|');
        if (parts.length > 1) {
            templateRecId = parts[1];
        }
    }

    if (!templateRecId) {
        return { fields: [] };
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const returnItems: any[] = [];
        let skip = 0;
        let moreItems = true;
        const top = 100;

        while (moreItems) {
            const options = {
                method: 'GET' as const,
                url: `${baseUrl}/api/odata/businessobject/ServiceReqTemplateParams`,
                qs: {
                    $filter: `ParentLink_RecID eq '${templateRecId}'`,
                    $select: 'RecId,DisplayName,DisplayType,Name,ConfigOptions,RequiredExpression',
                    $top: top,
                    $skip: skip,
                },
                json: true,
                skipSslCertificateValidation: allowUnauthorizedCerts,
            };

            const response = await this.helpers.httpRequestWithAuthentication.call(this, 'ivantiNeuronsItsmApi', options);
            const items = response.value || [];

            if (items.length > 0) {
                returnItems.push(...items);
                skip += top;
            } else {
                moreItems = false;
            }

            if (items.length < top) {
                moreItems = false;
            }
        }

        const ignoredTypes = ['category', 'label', 'image', 'rowaligner'];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fields: any[] = [];
        for (const item of returnItems) {
            const lowerType = (item.DisplayType || '').toLowerCase();

            // Filter out ignored types
            if (ignoredTypes.some(type => lowerType.includes(type))) {
                continue;
            }

            const isDropdown = lowerType.includes('dropdown') ||
                lowerType.includes('picklist') ||
                lowerType.includes('list') ||
                lowerType.includes('combo');

            // Helper to capitalize first letter
            const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1);
            let displayType = capitalize(item.DisplayType);

            // Rename 'Combo' to 'Dropdown' for clarity
            if (displayType.toLowerCase() === 'combo') {
                displayType = 'Dropdown';
            }

            let foundBoName = false;

            // try parse boName from ConfigOptions
            if (isDropdown) {
                if (item.ConfigOptions) {
                    try {
                        const config = JSON.parse(item.ConfigOptions);
                        // Check for validationListAdditionalConfig inside configData
                        const additionalConfig = config.configData?.validationListAdditionalConfig || config.validationListAdditionalConfig;

                        if (additionalConfig && additionalConfig.length > 0) {
                            const boName = additionalConfig[0].boName;
                            if (boName) {
                                const cleanBoName = boName.replace('#', '');
                                displayType = `${cleanBoName} ${displayType}`;
                                foundBoName = true;
                            }
                        }
                    } catch {
                        // ignore parse error
                    }
                }

                if (!foundBoName && (lowerType.includes('list') || lowerType.includes('combo'))) {
                    displayType = `Manual ${displayType}`;
                }
            }

            // Main value field
            let mainDisplayName: string;

            if (!isDropdown) {
                // Non-dropdown: Name [Global_Type]
                mainDisplayName = `${item.Name} [${displayType}]`;
            } else {
                // Dropdown types: use lowercase type in parentheses
                const lowerType = displayType.toLowerCase();

                if (foundBoName) {
                    // Name (type) [BusinessObject Value]
                    const boName = displayType.split(' ')[0]; // Extract BO name from "BB_Categories Dropdown"
                    const typeOnly = displayType.split(' ')[1] || displayType; // Get just the type part
                    mainDisplayName = `${item.Name} (${typeOnly.toLowerCase()}) [${boName} Value]`;
                } else {
                    // Name (manual type) [Value]
                    mainDisplayName = `${item.Name} (${lowerType}) [Value]`;
                }
            }

            // Determine the field type for resourceMapper
            let fieldType: string = 'string';
            const isCheckbox = lowerType.includes('checkbox');
            const isDateTime = lowerType.includes('datetime') || lowerType.includes('date');
            const isTime = lowerType.includes('time') && !isDateTime;

            if (isCheckbox) {
                fieldType = 'boolean';
            } else if (isDateTime) {
                fieldType = 'dateTime';
            } else if (isTime) {
                fieldType = 'time';
            }

            // Check if parameter is required based on RequiredExpression
            const isRequired = item.RequiredExpression === '$(true)';

            fields.push({
                id: item.RecId,
                displayName: mainDisplayName,
                required: isRequired,
                defaultMatch: false,
                display: true,
                type: fieldType,
            });

            // Secondary RecID field for dropdowns
            if (isDropdown) {
                const lowerType = displayType.toLowerCase();
                let recIdDisplayName: string;

                if (foundBoName) {
                    const boName = displayType.split(' ')[0];
                    const typeOnly = displayType.split(' ')[1] || displayType;
                    recIdDisplayName = `${item.Name} (${typeOnly.toLowerCase()}) [${boName} RecId]`;
                } else {
                    recIdDisplayName = `${item.Name} (${lowerType}) [RecId]`;
                }

                fields.push({
                    id: `${item.RecId}_option`,
                    displayName: recIdDisplayName,
                    required: isRequired,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                });
            }
        }

        // Sort by displayName
        fields.sort((a, b) => a.displayName.localeCompare(b.displayName));

        return { fields };

    } catch {
        return { fields: [] };
    }
}
