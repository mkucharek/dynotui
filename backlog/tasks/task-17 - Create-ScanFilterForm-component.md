---
id: task-17
title: Create ScanFilterForm component
status: Done
assignee: []
created_date: '2025-12-26 19:28'
updated_date: '2025-12-26 19:36'
labels:
  - scan-filter
  - component
dependencies:
  - task-16
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a new `ScanFilterForm` component at `src/components/forms/scan-filter-form.tsx`. This is a simpler wrapper around the existing `FilterBuilder` component (no key condition fields like QueryForm). Props: `onSubmit(filters: FilterCondition[])`, `onCancel()`. Export from `src/components/index.ts`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ScanFilterForm wraps FilterBuilder
- [x] #2 Accepts onSubmit and onCancel props
- [x] #3 Exported from components/index.ts
<!-- AC:END -->
