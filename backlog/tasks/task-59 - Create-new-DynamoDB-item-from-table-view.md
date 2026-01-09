---
id: task-59
title: Create new DynamoDB item from table view
status: To Do
assignee: []
created_date: '2026-01-09 21:12'
updated_date: '2026-01-09 21:12'
labels:
  - feature
  - crud
  - table-view
dependencies:
  - task-58
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add ability to create new items in DynamoDB tables.

## Requirements

### Entry Points
- Press 'c' in table view to create new item
- Press 'C' (Shift+c) with item selected to clone it

### Create Flow (c)
1. Open JSONEditor in full-screen mode
2. Pre-populate with table's key schema:
   ```json
   {
     "pk_attribute_name": "",
     "sk_attribute_name": ""  // if table has SK
   }
   ```
3. User fills in values
4. Submit triggers validation + PutItem

### Clone Flow (C)
1. Copy all attributes from selected item
2. Clear PK and SK values (user must change them)
3. Same editor flow as create

### Validation
- Ensure PK field is present and non-empty
- Ensure SK field is present and non-empty (if table has SK)
- Show validation errors before attempting write

### Write Operation
- Use PutItem command
- Show confirmation dialog: "Create item?"
- On success: refresh table data, show success message
- On failure: show error modal with retry option

## Technical Notes
- Add create mode handling to table-view.tsx
- Create `src/services/dynamodb/put-item.ts`
- Reuse JSONEditor component
- Add 'c' and 'C' to footer hints

## Dependencies
- task-XX (JSONEditor component)

## Related Doc
See doc-8 for full feature planning context.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 'c' key opens JSONEditor with key schema template
- [ ] #2 'C' key clones selected item with cleared keys
- [ ] #3 PK/SK validation before write attempt
- [ ] #4 Confirmation dialog before PutItem
- [ ] #5 Success refreshes table and shows feedback
- [ ] #6 Error modal with details and retry option
- [ ] #7 Footer hints show create keybinding
<!-- AC:END -->
