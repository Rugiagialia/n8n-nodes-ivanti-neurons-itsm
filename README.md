# n8n-nodes-ivanti-neurons-itsm

[![npm version](https://img.shields.io/npm/v/n8n-nodes-ivanti-neurons-itsm.svg)](https://www.npmjs.com/package/n8n-nodes-ivanti-neurons-itsm)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-ivanti-neurons-itsm.svg)](https://www.npmjs.com/package/n8n-nodes-ivanti-neurons-itsm)

This is an n8n community node for [Ivanti Neurons for ITSM](https://www.ivanti.com/products/ivanti-neurons-for-itsm) (formerly Ivanti Service Manager). It allows you to interact with Ivanti's ITSM platform to manage business objects, relationships, attachments, and perform advanced searches.

## Features

This node provides comprehensive access to Ivanti Neurons ITSM through three main resources:

### 📦 Business Object Operations

Manage any business object type (Incidents, Changes, Problems, etc.):

- **Create** - Create new business objects with manual field mapping or JSON
- **Get** - Retrieve a single business object by ID with optional field selection
- **Get Many** - Retrieve multiple business objects with filtering, sorting, and pagination
- **Update** - Update existing business objects
- **Delete** - Delete business objects

**Advanced Features:**
- Manual field mapping with type conversion (string, number, boolean, array, object)
- JSON mode for complex data structures
- Field selection ($select) with list or manual mode
- OData filtering ($filter)
- Sorting ($orderby)
- Automatic batching and throttling for bulk operations
- Pagination controls for large datasets

### 🔗 Relationship Operations

Link and manage relationships between business objects:

- **Create** - Link two business objects (e.g., link a Journal Note to an Incident)
- **Delete** - Remove a relationship between business objects
- **Get Related** - Retrieve all related business objects

### 📎 Attachment Operations

Upload, download, and manage file attachments:

- **Upload** - Upload files to business objects (Incidents, Changes, etc.)
- **Get** - Download attachment files by ID
- **Delete** - Remove attachments

### ⚡ Trigger Operations

Start workflows based on events in Ivanti Neurons ITSM:

- **Object Created**: Triggers when a new object is created.
- **Object Updated**: Triggers when an object is modified.
  > **⚠️ Important**: Due to how Ivanti handles timestamps during manual object creation (timestamps are set at different stages of the creation process), the "Object Updated" trigger will also catch newly created objects. This happens because `LastModDateTime` is updated when the object is saved, which can be 1-3 minutes after `CreatedDateTime` is initially set.
  >
  > **Recommendation**: Use the **Filter** field (visible when "Object Updated" is selected) to exclude unwanted items. For example, filter by specific status changes that only happen on real updates.

### Filtering
- **Filter**: OData filter expression (e.g., `Status eq 'Active'`).
  - For **Object Updated**: The Filter field appears as a main property.
  - For **Object Created**: The Filter field is available under "Options".
- **Polling** - Configurable polling interval (e.g., every minute, every hour)
- **Filtering** - Optional OData filters to only trigger on specific records (e.g., only High Priority Incidents)

### 🔍 Search Operations

Search and query business objects across your Ivanti instance:

- **Simple Search** - Search business objects with OData filtering, sorting, and pagination
- **Full Text Search** - Perform full-text searches across all business object fields
- **Execute Saved Search** - Run saved searches configured in Ivanti with dynamic parameter loading

**Advanced Features:**
- OData filtering and sorting
- Configurable result limits and pagination
- Dynamic loading of saved searches from Ivanti
- Field selection for optimized queries

### 🎫 Service Request Operations

Create service requests from templates/subscriptions:

- **Create** - Create service requests using predefined templates with dynamic parameters

**Advanced Features:**
- **Template Selection** - Resource locator to browse and select subscription templates for specific users
- **Dynamic Parameters** - ResourceMapper UI that automatically loads and displays template-specific parameters
- **Parameter Type Support** - Full support for:
  - Text fields
  - Dropdowns (BO-linked and manual)
  - Checkboxes (boolean values)
  - Date, DateTime, and Time fields
  - Multi-value lists (using `~^` separator)
- **Required Field Validation** - Automatically marks required parameters based on template configuration
- **Request On Behalf** - Create service requests for other users
- **Custom Details** - Optional Subject and Symptom fields
- **Advanced Options** - Delayed fulfill, custom forms, state saving, timezone offset

## Installation

### Community Install (Recommended)

For n8n Cloud or self-hosted instances with community nodes enabled:

```bash
npm install n8n-nodes-ivanti-neurons-itsm
```

### Manual Install (Development)

For local development or custom n8n instances:

```bash
# Clone the repository
git clone https://github.com/Rugiagialia/n8n-nodes-ivanti-neurons-itsm.git
cd n8n-nodes-ivanti-neurons-itsm

# Install dependencies
npm install

# Build the node
npm run build

# Link to n8n
cd ~/.n8n/nodes
npm install /path/to/n8n-nodes-ivanti-neurons-itsm
```

Restart n8n to load the node.

## Credentials

This node requires an Ivanti Neurons ITSM API credential with:

- **Tenant URL** - Your Ivanti cloud instance URL (e.g., `https://example.ivanticloud.com`)
- **API Key** - Your REST API key from Ivanti
- **Ignore SSL Issues** - Optional, for self-signed certificates

To generate an API key in Ivanti:
1. Log in to your Ivanti instance
2. Navigate to **Configuration** → **Security Settings** → **API Keys**
3. Create a new REST API key

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

### Example 4: Search for Incidents

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

### Example 5: Trigger on New Incident

```javascript
Node: Ivanti Neurons for ITSM Trigger
Trigger On: Object Created
Business Object Name: Incident
Poll Times: Every Minute
Options:
  - Filter: "Priority eq '1'"
  - Strip Null Values: true
```

### Example 6: Create a Service Request

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

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

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
