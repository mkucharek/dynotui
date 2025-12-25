---
title: "Phase 5: Views Integration"
status: Done
labels: [views, integration]
---

# Phase 5: Views Integration

Connect components into full views.

## Tasks
- [x] `src/views/home.tsx` - table list view
  - List tables
  - Select table -> navigate to table-view
- [x] `src/views/table-view.tsx` - scan/query results
  - DataTable with items
  - Pagination
  - Query mode toggle (q)
  - Scan mode (s)
  - Select item -> navigate to item-view
- [x] `src/views/item-view.tsx` - item detail
  - JSON display
  - Esc to go back
- [x] Wire up routing in app.tsx
- [x] Global keybindings (q=quit, Ctrl+C=exit)

## Acceptance
- Full navigation flow works
- Can browse tables, scan, view items
- Keybindings work globally

## Refs
- docs: [[architecture]]
- depends: [[phase-4-ui-components]]
