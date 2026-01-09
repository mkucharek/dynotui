---
id: task-64
title: Reset table state on table/view change
status: To Do
assignee: []
created_date: '2026-01-09 21:18'
labels:
  - feature
  - table-view
  - navigation
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ensure consistent state when switching between tables or loading saved queries.

## Requirements

### Table Change Behavior
When selecting a different table:
- Clear all filter conditions
- Reset to scan mode (not query)
- Clear any loaded items
- Execute fresh scan
- Set cursor to row 0 (first item highlighted)

### Saved Query Load Behavior
When loading a saved query:
- Apply saved query params (replaces current state)
- Execute the query immediately
- Set cursor to row 0
- (This is already defined in task-62, but ensure cursor reset)

### Cursor Reset
- First row should be highlighted/selected after any table change
- If table is empty, handle gracefully (no selection)

## Technical Notes
- Modify table selection handler in sidebar
- Clear `scanStateCache` and `queryStateCache` for previous table
- Reset `selectedRowIndex` to 0 in table-view state
- Ensure scan executes on table change (may already happen)

## Current Behavior Check
- Verify current behavior and document what needs to change
- May already partially work - need to audit

## Related Doc
See doc-8 for feature context.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Changing tables clears all filter conditions
- [ ] #2 Changing tables resets to scan mode
- [ ] #3 Fresh scan executes on table change
- [ ] #4 Cursor resets to row 0 on table change
- [ ] #5 Cursor resets to row 0 when loading saved query
- [ ] #6 Empty table handled gracefully (no crash)
<!-- AC:END -->
