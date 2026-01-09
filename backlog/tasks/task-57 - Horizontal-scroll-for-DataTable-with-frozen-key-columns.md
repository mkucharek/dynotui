---
id: task-57
title: Horizontal scroll for DataTable with frozen key columns
status: To Do
assignee: []
created_date: '2026-01-09 21:12'
labels:
  - feature
  - ui
  - table-view
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Currently DataTable is limited to 5 auto-selected columns. Users cannot see all item attributes.

Implement horizontal scrolling for the DataTable component with frozen primary key columns.

## Requirements

### Frozen Columns
- PK column always visible and frozen on left
- SK column (if table has one) frozen after PK
- Remaining columns scroll horizontally

### Scroll Navigation
- h / ← : Scroll columns left
- l / → : Scroll columns right
- j/k and ↑/↓ remain for row navigation

### Column Width
- Keep existing auto-fit logic for column widths
- Columns should size to content
- Minimum column width enforced

### Visual Feedback
- Clear visual separator between frozen and scrollable sections
- Scroll position indicator (e.g., "Cols 3-7 of 12")
- Indicate when more columns exist in either direction

## Technical Notes
- Modify `src/components/table/data-table.tsx`
- Track horizontal scroll offset in component state
- Calculate visible column range based on available width
- Render frozen section + scrollable section separately
- Update footer hints to show h/l navigation when applicable

## Related Doc
See doc-8 for full feature planning context.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 PK (and SK if exists) columns remain visible while scrolling
- [ ] #2 h/l and arrow keys scroll columns horizontally
- [ ] #3 Column widths auto-fit to content
- [ ] #4 Scroll position indicator shows current column range
- [ ] #5 Visual separator between frozen and scrollable sections
- [ ] #6 Footer hints updated for horizontal navigation
<!-- AC:END -->
