---
title: "Phase 3: State Management"
status: To Do
labels: [state, react]
---

# Phase 3: State Management

Zustand store + custom hooks for app state.

## Tasks
- [ ] `src/store/app-store.ts` - Zustand store
  - profile, region, currentTable, view state
  - setProfile, setRegion, navigate actions
- [ ] `src/store/use-tables.ts` - fetch table list hook
- [ ] `src/store/use-scan.ts` - scan operation hook w/ pagination
- [ ] `src/store/use-query.ts` - query operation hook
- [ ] `src/store/use-navigation.ts` - view navigation hook
- [ ] `src/types/navigation.ts` - view/navigation types
- [ ] Unit tests for store + hooks (ink-testing-library)

## Acceptance
- Zustand store provides global state
- Hooks correctly manage loading/error states
- Navigation between views works
- Tests pass

## Refs
- docs: [[architecture]]
- depends: [[phase-2-aws-services]]
