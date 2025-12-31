---
id: task-54
title: GSI/LSI Support Implementation
status: Done
assignee: []
created_date: '2025-12-31 20:51'
labels:
  - feature
  - dynamodb
  - ui
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Added support for Global Secondary Indexes (GSI) and Local Secondary Indexes (LSI) in dynotui.

## Implemented
- Extract index metadata from describeTable response
- Index selector in query form with dynamic key names
- GSI scan support with indexName parameter
- Index count display in metadata bar
- Index name display in query summary

## Files Changed
- src/services/dynamodb/tables.ts - IndexInfo type, getTableInfo updates
- src/components/forms/index-selector.tsx - New component
- src/components/forms/query-form.tsx - Index selection UI
- src/views/table-view.tsx - Pass indexes to form
- src/services/dynamodb/scan.ts - indexName param
- src/store/use-scan.ts - indexName in state
- src/components/table/query-filter-summary.tsx - Display index name
<!-- SECTION:DESCRIPTION:END -->
