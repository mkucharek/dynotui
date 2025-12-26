---
id: task-15
title: Use pageSize from store in scan/query hooks
status: Done
assignee: []
created_date: '2025-12-26 17:38'
updated_date: '2025-12-26 17:43'
labels:
  - settings
  - data
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace hardcoded limit of 25 with store pageSize.

- Update use-scan.ts to read pageSize from store
- Update use-query.ts to read pageSize from store
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Scan uses configured pageSize
- [x] #2 Query uses configured pageSize
- [x] #3 Changing pageSize in settings affects data loading
<!-- AC:END -->
