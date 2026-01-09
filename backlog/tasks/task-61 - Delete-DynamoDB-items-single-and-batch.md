---
id: task-61
title: Delete DynamoDB items (single and batch)
status: To Do
assignee: []
created_date: '2026-01-09 21:12'
labels:
  - feature
  - crud
  - table-view
  - item-view
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add ability to delete items from DynamoDB tables.

## Requirements

### Single Delete (Item View)
- Press 'd' in item detail view
- Show confirmation: "Delete this item?"
- Execute DeleteItem on confirm
- Return to table view on success

### Batch Delete (Table View)
1. Selection mode:
   - Press Space to toggle selection on current row
   - Visual indicator for selected rows (checkbox/highlight)
   - Selection count shown in footer
2. Delete action:
   - Press 'd' to open delete preview modal
   - Modal shows list of items to delete (PK/SK values)
   - Press Enter to confirm, Escape to cancel
3. Execute BatchWriteItem for deletion
4. Refresh table on success

### Visual Feedback
- Selected rows have distinct background/prefix
- Footer shows selection count: "3 selected"
- Delete preview modal lists items clearly

### Error Handling
- Show error modal with retry option
- For batch: show which items failed
- Allow retrying failed deletions

## Technical Notes
- Add selection state to table-view (Set of row indices or keys)
- Create `src/services/dynamodb/delete-item.ts`
- Create `src/services/dynamodb/batch-delete.ts`
- Create DeletePreviewModal component
- Add 'd' to footer hints, Space for selection

## Related Doc
See doc-8 for full feature planning context.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 'd' in item view shows delete confirmation
- [ ] #2 Space toggles row selection in table view
- [ ] #3 Selected rows visually distinguished
- [ ] #4 Footer shows selection count
- [ ] #5 'd' in table view opens delete preview modal
- [ ] #6 Preview modal lists items to delete with keys
- [ ] #7 BatchWriteItem used for multiple deletions
- [ ] #8 Error modal shows failed items with retry
<!-- AC:END -->
