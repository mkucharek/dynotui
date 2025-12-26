---
id: task-4
title: Export resetClient from dynamodb client module
status: Done
assignee: []
created_date: '2025-12-26 16:27'
updated_date: '2025-12-26 16:28'
labels:
  - feature
  - service
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ensure `resetClient()` is exported from `src/services/dynamodb/client.ts` and re-exported from `src/services/dynamodb/index.ts` so HomeView can reset client after profile/region change.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 resetClient exported from dynamodb/client.ts
- [ ] #2 resetClient re-exported from dynamodb/index.ts
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
resetClient already exported from both client.ts and index.ts
<!-- SECTION:NOTES:END -->
