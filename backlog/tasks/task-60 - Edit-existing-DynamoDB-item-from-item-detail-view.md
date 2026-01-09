---
id: task-60
title: Edit existing DynamoDB item from item detail view
status: To Do
assignee: []
created_date: '2026-01-09 21:12'
updated_date: '2026-01-09 21:12'
labels:
  - feature
  - crud
  - item-view
dependencies:
  - task-58
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add ability to edit existing items in DynamoDB tables.

## Requirements

### Entry Point
- Press 'e' in item detail view to edit current item

### Edit Flow
1. Open JSONEditor with current item data
2. PK and SK fields marked as read-only (cannot change keys)
3. User modifies other attributes
4. Submit triggers validation + PutItem (full replace)

### Key Handling
- Display PK/SK fields but prevent editing
- Visual indication that keys are locked (different color/prefix)
- Changing keys requires clone workflow instead

### Write Operation
- Use PutItem command (replaces entire item)
- Show confirmation dialog: "Save changes?"
- On success: update item view, show success message
- On failure: show error modal with retry option

### Navigation
- After successful edit, return to item view with updated data
- Cancel returns to item view unchanged

## Technical Notes
- Add edit mode handling to item-view.tsx
- Reuse JSONEditor with readOnlyKeys prop
- Add 'e' to footer hints in item view

## Dependencies
- task-XX (JSONEditor component)

## Related Doc
See doc-8 for full feature planning context.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 'e' key opens JSONEditor with current item data
- [ ] #2 PK/SK fields displayed but not editable
- [ ] #3 Visual indication that keys are read-only
- [ ] #4 Confirmation dialog before PutItem
- [ ] #5 Success updates item view and shows feedback
- [ ] #6 Error modal with details and retry option
- [ ] #7 Cancel returns to item view without changes
<!-- AC:END -->
