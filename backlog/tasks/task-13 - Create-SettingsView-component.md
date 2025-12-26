---
id: task-13
title: Create SettingsView component
status: Done
assignee: []
created_date: '2025-12-26 17:38'
updated_date: '2025-12-26 17:43'
labels:
  - settings
  - ui
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
New view for managing app settings.

Structure with modes: browsing, selecting-profile, selecting-region, selecting-pageSize

Settings list:
- Profile: InlineSelector with AWS profiles
- Region: InlineSelector with regions
- Page Size: InlineSelector with [25, 50, 100, 200]

Bindings: Esc to go back, Enter to select, j/k to navigate
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Settings view renders all 3 settings
- [x] #2 Can change profile/region/pageSize via InlineSelector
- [x] #3 Esc returns to home view
- [x] #4 Changes auto-save to config
<!-- AC:END -->
