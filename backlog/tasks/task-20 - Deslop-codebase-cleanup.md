---
id: task-20
title: Deslop codebase cleanup
status: Done
assignee: []
created_date: '2025-12-28 08:27'
updated_date: '2025-12-28 08:33'
labels: []
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Remove AI-generated slop: unused code, dead exports, duplicated types, premature abstractions
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Delete FilterInput component + exports
- [x] #2 Delete useNavigation hook
- [x] #3 Delete app.tsx dead component
- [x] #4 Fix ConfigDefaults duplicate type
- [x] #5 Remove unused pagination abstractions
- [x] #6 Remove unused store selectors
- [x] #7 Consolidate profile/region state patterns
- [x] #8 DRY home.tsx handlers
- [x] #9 Fix useScan ref anti-pattern
- [x] #10 All tests pass
- [x] #11 pnpm check passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed deslop cleanup:
- Deleted FilterInput component (unused)
- Deleted useNavigation hook (unused)
- Deleted app.tsx (dead component)
- Removed ConfigDefaults duplicate type from app-store.ts
- Removed unused store selectors (selectConfig, selectRuntimeConfig, selectCurrentView, selectCanGoBack, selectConfigDefaults)
- Removed unused pagination abstractions (createPaginatedScan, fetchNextPage, createPaginatedQuery, fetchNextQueryPage)
- DRYed home.tsx handlers with finishProfileSwitch()
- Fixed useScan ref anti-pattern by using getScanState() directly
- Note: profile/region state consolidation skipped - runtimeProfile/runtimeRegion serve different purpose (source tracking for display)
<!-- SECTION:NOTES:END -->
