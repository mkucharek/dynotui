---
id: task-25
title: Add focus management to app store
status: Done
assignee: []
created_date: '2025-12-28 11:20'
updated_date: '2025-12-28 11:22'
labels:
  - layout-redesign
  - store
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend Zustand store to track focus state: which panel (sidebar/main) and which sidebar section (profiles/regions/tables) is focused.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 focusedPanel state: 'sidebar' | 'main'
- [x] #2 focusedSection state: 'profiles' | 'regions' | 'tables'
- [x] #3 Actions to switch focus
- [ ] #4 Tab key toggles panel focus
- [ ] #5 1/2/3 keys set sidebar section focus
<!-- AC:END -->
