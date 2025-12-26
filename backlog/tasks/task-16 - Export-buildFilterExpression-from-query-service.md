---
id: task-16
title: Export buildFilterExpression from query service
status: Done
assignee: []
created_date: '2025-12-26 19:28'
updated_date: '2025-12-26 19:36'
labels:
  - scan-filter
  - refactor
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Export the existing `buildFilterExpression` function and `buildFilterConditionClause` helper from `src/services/dynamodb/query.ts` so they can be reused by the scan service. Also re-export from `src/services/dynamodb/index.ts`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 buildFilterExpression exported from query.ts
- [x] #2 buildFilterExpression re-exported from dynamodb/index.ts
- [x] #3 Existing query functionality unaffected
<!-- AC:END -->
