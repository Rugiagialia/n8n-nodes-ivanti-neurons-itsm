# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- **Trigger Filter UX**: Unified the Trigger `Filter` field at the root level for both `Object Created` and `Object Updated`, while keeping runtime fallback support for legacy `Object Created` workflows that still store the filter inside `Options`.
- **Trigger Manual Testing**: Manual trigger tests now act as a diagnostic preview that fetches the single most recent record, does not update trigger static data, and can optionally apply the configured filter through `Options` → `Apply Filter In Test`.
- **Item Linking**: Added explicit `pairedItem` metadata to the main single-input REST and Web Service operations, including `Continue On Fail` outputs, so downstream expressions and mapping behave consistently.
- **Release Validation**: Added a publish-package validation flow around `npm pack --json --dry-run` and moved TypeScript build info out of `dist/` so the published tarball stays focused on runtime artifacts.

## [0.10.2] - 2026-03-25

### Fixed
- **Web Service Session Authorization**: Standardized the Web Service `Authorize` payload so credential tests and runtime execution both use the same fixed session timezone values (`tzoffset = 0`, `timezoneName = UTC`).

### Changed
- **Web Service Credentials**: Removed timezone fields from the credential UI because the internal session auth endpoint does not expose a clearly documented, user-meaningful timezone configuration.
- **Web Service Documentation Link**: Updated the Web Service credential documentation link to point to Ivanti's Web Service documentation instead of the REST API documentation.

## [0.10.1] - 2026-03-25

### Added
- **Trigger Overlap Protection**: Added `Overlap Seconds` to widen trigger polling windows for `Object Created` and `Object Updated`, with documentation focused on the `Object Updated` missed-update scenario.
- **Trigger Deduplication**: Added workflow static data deduplication by `RecId` to suppress repeated emissions caused by overlap lookback windows.

### Changed
- **Trigger Field Selection**: Trigger polling now auto-includes the technical date field and also forces `RecId` into `$select` when overlap deduplication is active.
- **Trigger Watermarking**: Polling watermark advancement now follows the last API item returned, even when overlap deduplication filters all emitted items.

## [0.10.0] - 2026-03-16

### Fixed
- **Web Service SSL Validation**: Centralized Web Service TLS handling so `Ignore SSL Issues` is applied consistently to session auth, localization, and search requests.
- **Web Service Search and Localization**: Removed local SSL overrides and duplicate credential reads so Web Service operations now use a single request path.
- **Web Service Continue On Fail**: Extended `Continue On Fail` to session/auth failures and normalized `details` output to a consistent string format.

## [0.9.2] - 2026-03-14

### Changed
- **Relationship Get Related**: Removed the dropdown-based `$select` mode and kept manual field selection only, so related-record queries do not suggest fields from the wrong business object.

## [0.9.1] - 2026-03-14

### Fixed
- **Relationship Get Related**: Added missing OData `$filter` support so related-record queries can be narrowed down like other multi-record operations.

### Added
- **Relationship Get Related**: Added optional OData `$select` support with manual field selection.

## [0.9.0] - 2026-03-13

### Added
- **New Node**: `Ivanti Neurons for ITSM (Web Service)` for session-based operations.
- **Localization Resource**: New resource for `Get` and `Update` operations for validation and localized values.
- **Query Resource**: New advanced query builder using `ObjectQueryDefinition`.
  - Supports **Relationships** (Many-to-Many joins).
  - Supports **Select Fields** with aliasing (e.g., `CI.Name`).
  - Supports **Filtering** with complex join logic.
  - Supports **Sorting** (OrderBy) with `ASC`/`DESC`.
  - Integrated **Pagination** (`Return All` / `Limit`).
- **Session Management**: Automatic handled session lifecycle (Authorize -> SelectRole -> Action -> Logout) for reliable API interaction.
- **Credentials**: New `Ivanti Neurons for ITSM Web Service API` credential type.

### Changed
- **Renamed Existing Node**: `Ivanti Neurons for ITSM` renamed to `Ivanti Neurons for ITSM (REST)` to distinguish it from the new Web Service-based operations.
- **Node Icons**: Updated `Ivanti Neurons for ITSM (Web Service)` icons with a high-contrast "WS" badge strategically placed on the top bar of the logo for better visibility and differentiation from the REST node.


## [0.8.1] - 2026-01-08

### Fixed
- **Service Request Create**: Fixed an issue where the "Ignore SSL Issues" credential option was ignored during service request creation.

## [0.8.0] - 2025-12-19

### Added
- **Service Request Resource**: New "Get Submitted Parameters" operation to retrieve parameters for existing service requests.
- **Service Request Create**: 
  - Added standard **Batching** support for throttling bulk creations.
  - Implemented **In-memory Schema Caching** with Promise-based concurrency handling for significantly improved performance in bulk executions.
  - Added `Use Schema Cache` option to toggle caching behavior.
- **Dropdowns**: Added logic to `getObjectFields` to ensure field selection dropdowns work even for empty Business Objects by resolving the BO name from parameters.

### Changed
- **UI Improvements**: Reordered "Create" operation properties for better user experience (Formatting notice moved above Parameters).
- **Default Sorting**: Updated `CreatedDateTime` as the default sort field across all `getAll` operations (Service Request and Business Object resources) for consistent initial results.
- **Service Request Parameters Notice**: Updated notice text in "Get Submitted Parameters" for better clarity on retrieving **ServiceReqParam** records.

## [0.7.0] - 2025-12-15

### Added
- **Service Request Resource**: New resource for creating service requests from templates/subscriptions
- **Dynamic Parameter Mapping**: ResourceMapper UI for flexible parameter value assignment  
- **Template Selection**: Resource locator for browsing and selecting subscription templates
- **Request On Behalf**: Option to create service requests for other users
- **Parameter Type Support**: Full support for text, dropdown (BO-linked and manual), checkbox (boolean), date, datetime, and time field types
- **Required Field Validation**: Automatic detection and marking of required parameters based on template configuration
- **Multi-value Lists**: Support for list parameters with multiple selections using `~^` separator

## [0.6.0] - 2025-12-02

### Added
- **Trigger Node Pagination**: Added `Return All`, `Limit`, and `Pagination` options to the Trigger node to handle large sets of pending items efficiently.
- **Output Sorting Toggle**: Added a "Sort Output Keys" toggle (default: true) to all operations. Users can now disable alphabetical sorting of output keys.
- **Case-Insensitive Sorting**: Output key sorting is now case-insensitive for better readability.
- **Trigger Node Select**: Added `$select` support to the Trigger node, allowing users to specify exactly which fields to return (including "From List" and "Manual" modes).

### Changed
- **Trigger Node Polling**: Refactored polling logic to support robust pagination for limits > 100.
- **Refactoring**: Centralized OData response cleaning and sorting logic.

## [0.5.3] - 2025-11-29

### Fixed
- **Trigger Node**: Fixed an issue where "Object Updated" trigger would incorrectly capture newly created objects due to timestamp discrepancies. Added a notice and recommendation to use filters.
- **Documentation**: Added a troubleshooting guide for package upgrade errors.

## [0.5.0] - 2025-11-27

### Added
- **New Trigger Node**: Start workflows when business objects are created or updated.
- **Polling Support**: Configurable polling intervals.
- **Data Cleaning**: Alphabetical key sorting and optional null value stripping.
- **Manual Testing Mode**: Easily test triggers by fetching the most recent record.

## [0.4.0] - 2025-11-26

### Added
- **Batching & Pagination UX**: New collapsible "Batching" and "Pagination" groups.
- **Enhanced Throttling**: Standardized batching logic across all operations.

## [0.3.5] - 2025-11-25

### Fixed
- **Compatibility**: Resolved initialization error on older n8n versions.
- **Error Handling**: Improved parsing of Ivanti API errors.

## [0.3.0] - 2025-11-25

### Added
- **Strip Null Values**: Added option to remove null values from output.

## [0.2.0] - 2025-11-24

### Added
- **Search Resource**: Simple Search, Full Text Search, Execute Saved Search.
- **Modular Architecture**: Refactored codebase.
- **Dark Mode Support**: Updated icons.

## [0.1.0] - 2024-01-01

### Added
- Initial release of the Ivanti Neurons for ITSM node.
- Support for Business Object operations (Create, Get, Update, Delete).
- Support for Relationship operations.
- Support for Attachment operations.
