---
id: task-11
title: Add pageSize to UserConfig and AppStore
status: Done
assignee: []
created_date: '2025-12-26 17:38'
updated_date: '2025-12-26 17:43'
labels:
  - settings
  - config
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend config persistence and state management to support page size setting.

- Add `pageSize?: number` to UserConfig type
- Update loadUserConfig/saveUserConfig to handle pageSize
- Add `pageSize: number` to AppState (default 25)
- Add `setPageSize` action with persistence
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 pageSize persists to ~/.config/dynotui/config.json
- [x] #2 Store loads pageSize from config on startup
- [x] #3 setPageSize action saves to config
<!-- AC:END -->
