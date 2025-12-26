---
id: task-18
title: Update useScan hook to support filter conditions
status: Done
assignee: []
created_date: '2025-12-26 19:28'
updated_date: '2025-12-26 19:36'
labels:
  - scan-filter
  - hook
dependencies:
  - task-16
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Modify `src/store/use-scan.ts` to accept `FilterCondition[]` and convert them to DynamoDB filter expressions using `buildFilterExpression`. Store filter conditions for pagination/refresh so the same filters are applied when fetching next pages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 useScan accepts FilterCondition[] parameter
- [x] #2 Converts to filter expression via buildFilterExpression
- [x] #3 Filter conditions preserved across pagination
<!-- AC:END -->
