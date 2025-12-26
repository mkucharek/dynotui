---
id: task-2
title: Add mode state and selectors to HomeView
status: Done
assignee: []
created_date: '2025-12-26 16:27'
updated_date: '2025-12-26 16:30'
labels:
  - feature
  - view
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update `src/views/home.tsx` to support profile/region switching.

- Add mode state: 'browsing' | 'selecting-profile' | 'selecting-region'
- Add keybindings: 'p' for profile, 'R' for region (in browsing mode only)
- Conditionally render InlineSelector based on mode
- On selection: update store, reset client, refresh tables
- Pre-select current profile/region in selector
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 'p' key opens profile selector
- [x] #2 'R' key opens region selector
- [x] #3 Selecting profile updates store and refreshes tables
- [x] #4 Selecting region updates store and refreshes tables
- [x] #5 Escape cancels selection and returns to browsing
- [x] #6 Current profile/region pre-selected when opening selector
<!-- AC:END -->
