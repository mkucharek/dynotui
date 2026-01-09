---
id: task-63
title: Auto-load all results with toggle keybinding
status: To Do
assignee: []
created_date: '2026-01-09 21:18'
labels:
  - feature
  - table-view
  - pagination
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add ability to automatically load all paginated results without manual 'n' presses.

## Requirements

### Keybinding
- Press 'A' to start auto-loading remaining pages
- Press 'A' again to stop auto-loading
- Toggle behavior (on/off)

### Loading Behavior
- Continuously fetch next page until no more results
- No hard limit - user controls via toggle
- Table updates live as items stream in

### Visual Feedback
- Footer shows loading state: "Loading... 1,234 items"
- Item count updates in real-time as pages load
- Clear indication when auto-load is active vs stopped

### Table Interaction
- Table remains interactive during auto-load
- User can navigate rows while loading continues
- Pressing 'A' stops loading, table keeps current items

## Technical Notes
- Add `isAutoLoading` state to scan/query hooks
- Modify `fetchNextPage` to loop when auto-loading
- Use async iteration or recursive calls with state check
- Update footer component to show loading status
- Add 'A' to footer hints

## Keybinding
- A: Toggle auto-load (start/stop)

## Related Doc
See doc-8 for feature context.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 'A' key starts auto-loading remaining pages
- [ ] #2 'A' key again stops auto-loading
- [ ] #3 Table updates live as items load
- [ ] #4 Footer shows 'Loading... N items' during auto-load
- [ ] #5 User can navigate table while loading
- [ ] #6 Auto-load stops when all pages fetched
- [ ] #7 Footer hints include 'A' keybinding
<!-- AC:END -->
