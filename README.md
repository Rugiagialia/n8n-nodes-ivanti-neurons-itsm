# n8n-nodes-ivanti-neurons-itsm

[![npm version](https://img.shields.io/npm/v/n8n-nodes-ivanti-neurons-itsm.svg)](https://www.npmjs.com/package/n8n-nodes-ivanti-neurons-itsm)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-ivanti-neurons-itsm.svg)](https://www.npmjs.com/package/n8n-nodes-ivanti-neurons-itsm)

This is an n8n community node for [Ivanti Neurons for ITSM](https://www.ivanti.com/products/ivanti-neurons-for-itsm) (formerly Ivanti Service Manager). It allows you to interact with Ivanti's ITSM platform to manage business objects, relationships, attachments, and perform advanced searches.

## What's New in v0.3.0

- 🧹 **Strip Null Values Option** - New option to remove null values from output for cleaner data processing

## Previous Updates (v0.2.0)

- ✨ **Search Resource** - Three new search operations (Simple Search, Full Text Search, Execute Saved Search)
- 🏗️ **Modular Architecture** - Refactored to a clean, maintainable structure
- 🎯 **Enhanced Error Handling** - Detailed error messages from Ivanti API
- ✅ **Type Validation** - Proper field type validation with clear error messages
- 🎨 **Dark Mode Support** - Updated icons for light and dark themes

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

Control request throttling to avoid API rate limits:

- **Items per Batch** - Number of items to process before pausing (default: 50, -1 to disable)
- **Batch Interval** - Milliseconds to wait between batches (default: 1000ms)

### Pagination (for Get Many operations)

Control pagination behavior for large datasets:

- **Pages per Batch** - Number of pages to fetch before pausing (default: 10, -1 to disable)
- **Pagination Interval** - Milliseconds to wait between page batches (default: 100ms)

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
