---
id: task-39
title: Unify query/scan state in app-store
status: Done
assignee: []
created_date: '2025-12-30 10:57'
updated_date: '2025-12-30 11:09'
labels:
  - architecture
  - phase-1
milestone: Visual Redesign v1
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Move query hook to use app-store cache like scan. Add queryStateCache Map, getQueryState/setQueryState. Enables consistent state mgmt, no stale closures, state preservation on nav
<!-- SECTION:DESCRIPTION:END -->
