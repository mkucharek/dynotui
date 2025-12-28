---
id: task-24
title: Create Sidebar component
status: Done
assignee: []
created_date: '2025-12-28 11:20'
updated_date: '2025-12-28 11:23'
labels:
  - layout-redesign
  - component
dependencies:
  - task-6
  - task-7
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Container component combining three SidebarSections: Profiles, Regions, Tables. Manages focus between sections via 1/2/3 keys.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Contains Profiles, Regions, Tables sections in order
- [x] #2 1/2/3 keys switch focus between sections
- [x] #3 Fetches and displays AWS profiles list
- [x] #4 Fetches and displays available regions
- [x] #5 Integrates with existing useTables hook for tables list
<!-- AC:END -->
