# n8n-nodes-ivanti-neurons-itsm

[![npm version](https://img.shields.io/npm/v/n8n-nodes-ivanti-neurons-itsm.svg)](https://www.npmjs.com/package/n8n-nodes-ivanti-neurons-itsm)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-ivanti-neurons-itsm.svg)](https://www.npmjs.com/package/n8n-nodes-ivanti-neurons-itsm)

This is an n8n community node for [Ivanti Neurons for ITSM](https://www.ivanti.com/products/ivanti-neurons-for-itsm) (formerly Ivanti Service Manager). It allows you to interact with Ivanti's ITSM platform to manage business objects, relationships, attachments, and perform advanced searches.

## 🏢 Dual Node Architecture

This package provides two different nodes to handle the varied requirements of the Ivanti Neurons for ITSM platform:

### 🚀 Ivanti Neurons for ITSM (REST)
The **primary node** for most operations. It uses Modern API Keys and is optimized for standard Business Object lifecycle management.
- **Best for**: Incidents, Service Requests, Tasks, Attachments, and common searches.
- **Auth**: API Key (Modern/Fast).

### ⚙️ Ivanti Neurons for ITSM (Web Service)
An **advanced node** designed for specific internal operations and complex queries that the REST API cannot handle.
- **Best for**: Localization/Translations, Many-to-Many relationship queries, and cross-object aliasing.
- **Auth**: Session-based (Username/Password/Role).
- **Visuals**: Easily identifiable by the **WS** badge on the icon.

---

## Features

### 🚀 REST Node: Core Operations
The REST node handles the majority of Ivanti ITSM interactions using Efficient API Key authentication.

#### 📦 Business Objects
Manage any business object type (Incidents, Changes, Problems, etc.):
- **Create** - New records with manual field mapping or raw JSON.
- **Get** - Single record retrieval by ID with optional field selection.
- **Get Many** - Multi-record fetch with OData filtering, sorting, and pagination.
- **Update** - Modify existing record fields.
- **Delete** - Remove records from the system.
- **Advanced Features**: Manual type conversion (string, number, boolean, array, object), Field selection ($select), OData filtering ($filter), and Automatic Batching.

#### 🔗 Relationships
Link and manage connections between objects:
- **Create** - Link two business objects (e.g., Journal to Incident).
- **Delete** - Remove an existing link.
- **Get Related** - Retrieve related business objects for a specific record with optional OData `$filter` and manual `$select`.

#### 📎 Attachments
Standard file management:
- **Upload** - Add files to any business object.
- **Get** - Download attachment files by ID.
- **Delete** - Remove attachments from records.

#### ⚡ Triggers
Start workflows based on platform events:
- **Object Created**: Triggers when a new object is detected.
- **Object Updated**: Triggers when an object is modified.
- **Polling**: Configurable intervals for checking updates.
- **Filtering**: Native OData filters to ignore irrelevant updates.
- **Overlap Protection**: Optional overlap window plus `RecId` deduplication to reduce missed `Object Updated` events near poll boundaries.

#### 🔍 Search
Standard search capabilities:
- **Simple Search** - Standard OData-based querying.
- **Full Text Search** - Full-text indexing searches.
- **Execute Saved Search** - Run predefined Ivanti searches with dynamic parameters.

#### 🎫 Service Requests
Specialized logic for fulfilling user requests:
- **Create** - Template/Subscription-based creation with dynamic ResourceMapper parameters.
- **Get Parameters** - Retrieve submitted `ServiceReqParam` records for a specific request.
- **Validation**: Automatic detection of required fields from the template.

---

### ⚙️ Web Service Node: Advanced Operations
Perform specialized tasks using Ivanti's internal Web Service APIs for scenarios the REST API cannot handle.

#### 🌍 Localization
- **Get Localized Values** - Fetch translated values for forms and dropdowns.
- **Update Translations** - Modify localization strings across the system.
- **Batching**: Built-in support for processing localization strings in throttled batches.

#### 🔎 Advanced Query (Search)
- **Complex Joins** - Query many-to-many relationships (e.g., Search Incidents via linked CI relationships).
- **Precise Aliasing** - Fetch specific fields from related objects in a single call (e.g., `CI.Name`).
- **Flexible results** - Use `Return All` toggle or specify a precise result `Limit`.

---

## Credentials

You will need to configure different credentials depending on which node you are using:

### 1. Ivanti Neurons ITSM API (for REST Node)
- **Tenant URL**: Your instance URL (e.g., `https://example.ivanticloud.com`).
- **API Key**: Generated in **Configuration** → **Security Settings** → **API Keys**.

### 2. Ivanti Neurons ITSM Web Service API (for Web Service Node)
- **Tenant URL**: Your instance URL.
- **App ID**: Optional override for the `Authorize` request when the tenant hostname is not the correct app identifier.
- **Username / Password**: Standard user credentials.
- **Role**: The specific role to assume (e.g., `Admin`).
- **Session Timezone**: The node currently creates Web Service sessions with a fixed `tzoffset = 0` and `timezoneName = UTC`.

## Usage Examples

### Example 1: Create an Incident

```javascript
// Using Manual Mapping mode
Resource: Business Object
Operation: Create
Business Object Name: Incident
Mode: Manual Mapping
Fields to Set:
  - Subject = "Server is down"
  - Status = "Active"
  - Priority = "1"
```

### Example 2: Get Incidents with Filtering

```javascript
Resource: Business Object
Operation: Get Many
Business Object Name: Incident
Return All: false
Limit: 50
Options:
  - Filter: "Status eq 'Active' and Priority eq '1'"
```

### Example 3: Upload an Attachment

```javascript
Resource: Attachment
Operation: Upload
Business Object Name: Incident
Record ID: "12345ABC"
File Name: "screenshot.png"
Input Binary Field: "data"
```

### Example 4: Get Related Journal Records with Filtering

```javascript
Resource: Relationship
Operation: Get Related
Business Object Name: Incident
Record ID: "12345ABC"
Relationship Name: "IncidentContainsJournal"
Send Select Parameters: true
Select (Manual): "RecId,Subject"
Options:
  - Filter: "Subject eq 'n8n'"
```

### Example 5: Search for Incidents

```javascript
// Simple Search
Resource: Search
Operation: Simple Search
Business Object Name: Incident
Return All: false
Limit: 100
Options:
  - Filter: "Status eq 'Active'"
  - Sort By: "CreatedDateTime desc"

// Execute Saved Search
Resource: Search
Operation: Execute Saved Search
Saved Search: "My Active Incidents" (from dropdown)
Return All: true
```

### Example 6: Trigger on New Incident

```javascript
Node: Ivanti Neurons for ITSM Trigger
Trigger On: Object Created
Business Object Name: Incident
Poll Times: Every Minute
Filter: "Priority eq '1'"
Options:
  - Strip Null Values: true
```

### Example 7: Trigger on Updated Incident with Overlap Protection

```javascript
Node: Ivanti Neurons for ITSM Trigger
Trigger On: Object Updated
Business Object Name: Incident
Poll Times: Every Minute
Filter: "Status eq 'Active'"
Options:
  - Overlap Seconds: 90
  - Deduplicate By RecId: true
```

### Example 8: Create a Service Request

```javascript
Resource: Service Request
Operation: Create
Requester User ID: (select from list or enter ID)
Subscription ID: (select from list - shows available templates)
Parameters: (ResourceMapper - fields load based on selected template)
  - Category: "Hardware"
  - Priority: "High"
  - Description: "New laptop needed"
  - DeliveryDate: (date picker)
  - ApprovalRequired: true (checkbox)
Options:
  - Set Details:
    - Subject: "New Equipment Request"
    - Symptom: "Employee needs new laptop for project"
```

## Configuration Options

### Strip Null Values

Remove fields with null values from the output for cleaner data processing:

- **Available for**: Get, Get Many, Create, Update (Business Object), Get Related (Relationship), and all Search operations
- **Default**: Off (all values including nulls are returned)
- **When enabled**: Recursively removes all fields with null values from the JSON output

**Example:**
```javascript
// With Strip Null Values OFF (default):
{
  "RecId": "12345",
  "Subject": "Test",
  "Priority": null,
  "Owner": null
}

// With Strip Null Values ON:
{
  "RecId": "12345",
  "Subject": "Test"
}
```

### Batching (for Create/Update/Delete/Get operations)
 
Control request throttling to avoid API rate limits using the new **Batching** fixed collection:
 
- **Items per Batch** - Number of items to process before pausing (default: 50, -1 to disable)
- **Batch Interval** - Milliseconds to wait between batches (default: 1000ms)
 
### Pagination (for Get Many & Search operations)
 
Control pagination behavior for large datasets using the new **Pagination** fixed collection:
 
- **Pages per Batch** - Number of pages to fetch before pausing (default: 10, -1 to disable)
- **Pagination Interval** - Milliseconds to wait between page batches (default: 100ms)

### Sort Output Keys

Control the order of keys in the output JSON:

- **Available for**: All operations
- **Default**: On (keys are sorted alphabetically, case-insensitive)
- **When disabled**: Keys appear in the order returned by the API (or processing order)

### Field Selection

Choose which fields to return:

- **From List** - Select fields from a dropdown (dynamically fetched from Ivanti)
- **Manual** - Enter field names as comma-separated list
- **Trigger note** - Trigger polling automatically adds the technical date field (`CreatedDateTime` or `LastModDateTime`) and also adds `RecId` when overlap deduplication is active.

### Trigger Overlap And Deduplication

`Object Updated` polling can miss records when Ivanti applies an update or makes a filter condition true close to the polling boundary. By default the node uses a strict `dateField gt lastTimeChecked` filter, so the default `Overlap Seconds` remains `0` for backward compatibility.

Use these trigger options when you need safer polling:

- **Overlap Seconds** - Looks back before the previous watermark when building the polling filter. This is most useful for `Object Updated`, but is available for both trigger modes.
- **Deduplicate By RecId** - Prevents the same record from being emitted repeatedly when overlap causes the same `RecId` to appear in multiple poll cycles. This is enabled by default.

Recommended starting point:

- Poll every 1 minute
- Set `Overlap Seconds` to `90`
- Keep `Deduplicate By RecId` enabled

Tradeoff:

- Higher overlap reduces missed updates but increases the chance that Ivanti returns the same record more than once. The node suppresses repeated records by caching recently emitted `RecId` values in workflow static data.

### Trigger Manual Test Preview

The trigger's manual test mode is a lightweight preview, not a full polling simulation:

- **Result count** - Always fetches the single most recent matching record
- **No watermark updates** - Manual tests do not update workflow static data such as `lastTimeChecked` or overlap deduplication state
- **Filter control** - Use **Options → Apply Filter In Test** to decide whether the configured root `Filter` should be applied during manual testing

For backward compatibility, existing workflows that still store the `Object Created` filter in the legacy `Options` location continue to work at runtime, but new configurations should use the root `Filter` field for both trigger types.

### Item Linking

Primary REST and Web Service operations now return explicit `pairedItem` metadata on success and `Continue On Fail` outputs where the result comes from a single input item. This keeps downstream expressions and source-item mapping behavior consistent across CRUD, attachment, relationship, search, and localization operations.

## API Documentation

This node uses the Ivanti Neurons ITSM REST API:

- [REST API Introduction](https://help.ivanti.com/ht/help/en_US/ISM/2022/admin/Content/Configure/API/RestAPI-Introduction.htm)
- [OData API Reference](https://help.ivanti.com/ht/help/en_US/ISM/2022/admin/Content/Configure/API/OData-API.htm)
- [Attachment APIs](https://help.ivanti.com/ht/help/en_US/ISM/2022/admin/Content/Configure/API/Attachment-APIs.htm)

## Development

### Prerequisites

- Node.js v22 or higher
- npm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Validate the publish package
npm run pack:check

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

### Release Package Validation

Before creating a release tag, run the publish checks in this order:

```bash
npm ci
npm run build
npm run pack:check
```

`npm run pack:check` runs `npm pack --json --dry-run` and verifies that the tarball contains the built REST node, Trigger node, Web Service node, and credential files. It also fails if `dist/tsconfig.tsbuildinfo` is present in the package.

## Compatibility

- **n8n version**: 1.0.0 or higher
- **API Version**: Ivanti Neurons for ITSM 2019.1+

## Troubleshooting

### Node doesn't appear in n8n

1. Verify the node is installed: `ls ~/.n8n/nodes/node_modules`
2. Check package.json for correct n8n.nodes configuration
3. Restart n8n completely
4. Check n8n logs for errors

### Authentication fails

1. Verify your Tenant URL is correct (no trailing slash)
2. Check API Key is valid and active in Ivanti
3. Ensure your user has sufficient permissions
4. Try enabling "Ignore SSL Issues" if using self-signed certificates

### Rate limiting errors

Increase batch intervals:
- Items per Batch: 25
- Batch Interval: 2000ms

### Package upgrade errors (Class not found)

If you encounter "Class could not be found" errors after upgrading, especially in multi-worker setups:

**Steps to fix:**

1. **Uninstall via n8n UI**
   - Go to Settings → Community Nodes
   - Remove `n8n-nodes-ivanti-neurons-itsm`

2. **Clean installation on all environments**
   
   For **main instance**:
   ```bash
   cd ~/.n8n/nodes
   npm uninstall n8n-nodes-ivanti-neurons-itsm
   ```

   For **each worker** (if using workers):
   ```bash
   cd ~/.n8n/nodes
   npm uninstall n8n-nodes-ivanti-neurons-itsm
   ```

3. **Reinstall via n8n UI**
   - Go to Settings → Community Nodes
   - Install `n8n-nodes-ivanti-neurons-itsm`

4. **Restart all instances**
   - Restart main n8n instance
   - Restart all worker instances

> **Note**: This issue can occur when npm caches become stale during upgrades, particularly in distributed setups. It may also happen after introducing new node types (like the trigger node) to an existing package. Manual cleanup ensures a fresh installation.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

- [Report issues](https://github.com/Rugiagialia/n8n-nodes-ivanti-neurons-itsm/issues)
- [n8n Community Forum](https://community.n8n.io/)

## License

[MIT](LICENSE.md)

## Author

Built with ❤️ for the n8n community
