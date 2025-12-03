# Changelog

All notable changes to this project will be documented in this file.

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
