---
title: "Phase 5: Views Integration"
status: To Do
labels: [views, integration]
---

# Phase 5: Views Integration

Connect components into full views.

## Tasks
- [ ] `src/views/home.tsx` - table list view
  - List tables
  - Select table -> navigate to table-view
- [ ] `src/views/table-view.tsx` - scan/query results
  - DataTable with items
  - Pagination
  - Query mode toggle (q)
  - Scan mode (s)
  - Select item -> navigate to item-view
- [ ] `src/views/item-view.tsx` - item detail
  - JSON display
  - Esc to go back
- [ ] Wire up routing in app.tsx
- [ ] Global keybindings (r=region, P=profile, Ctrl+C=exit)
- [ ] Integration tests

## Acceptance
- Full navigation flow works
- Can browse tables, scan, view items
- Keybindings work globally

## Refs
- docs: [[architecture]]
- depends: [[phase-4-ui-components]]
