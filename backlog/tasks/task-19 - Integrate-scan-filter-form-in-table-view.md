---
id: task-19
title: Integrate scan filter form in table-view
status: Done
assignee: []
created_date: '2025-12-26 19:28'
updated_date: '2025-12-26 19:36'
labels:
  - scan-filter
  - integration
dependencies:
  - task-17
  - task-18
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update `src/views/table-view.tsx` to support scan filtering: add 'scan-filter-form' mode, bind 'f' key to open filter form in scan mode, handle form submit to refresh scan with filters, update footer bindings.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 'f' key opens ScanFilterForm when in scan mode
- [x] #2 Form submit refreshes scan with applied filters
- [x] #3 Footer shows 'f' for Filter option
- [x] #4 's' clears filters and returns to unfiltered scan
<!-- AC:END -->
