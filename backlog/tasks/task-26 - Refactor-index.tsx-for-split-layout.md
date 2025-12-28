---
id: task-26
title: Refactor index.tsx for split layout
status: Done
assignee: []
created_date: '2025-12-28 11:20'
updated_date: '2025-12-28 11:24'
labels:
  - layout-redesign
  - refactor
dependencies:
  - task-6
  - task-8
  - task-9
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace current single-view rendering with SplitLayout. Sidebar always visible, main panel shows TableView/ItemView/SettingsView based on navigation state.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 App renders SplitLayout with Sidebar and MainPanel
- [x] #2 Main panel switches content based on currentView
- [x] #3 Global keyboard handlers updated for new layout
- [x] #4 HomeView no longer rendered (replaced by sidebar)
<!-- AC:END -->
