---
id: task-62
title: Saved queries with sidebar tab
status: To Do
assignee: []
created_date: '2026-01-09 21:12'
updated_date: '2026-01-09 21:12'
labels:
  - feature
  - sidebar
  - config
dependencies:
  - task-57
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add ability to save and reload queries/scans for quick access.

## Requirements

### Save Query
- Press 'b' (bookmark) to save current query/scan
- Prompt for custom name (required)
- Save includes:
  - Query type (scan vs query)
  - Query params (PK, SK condition, index, filters)
  - Column display preferences (if horizontal scroll implemented)
- Stored per profile, organized by table

### Saved Tab in Sidebar
- Restore "Saved" tab in sidebar (was removed)
- Show all saved queries grouped by table name
- Each entry shows: name, table, query type icon
- Navigate with j/k, Enter to load

### Load Query
- Select saved query from sidebar
- Execute immediately (don't populate form)
- Switch to query/scan mode based on saved type
- Apply column preferences if saved

### Storage
- Extend UserConfig schema:
  ```typescript
  savedQueries?: {
    [profile: string]: {
      [tableName: string]: SavedQuery[]
    }
  }
  ```
- Persist to ~/.config/dynotui/config.json

### Management
- Delete saved query (x or d key in sidebar)
- No edit - delete and re-save

## Technical Notes
- Update `src/schemas/config.ts` with SavedQuery schema
- Update `src/services/user-config.ts` for new fields
- Create SavedQueriesSection component for sidebar
- Add bookmark mode to table-view for name input
- Add 'b' to footer hints when query/scan active

## Related Doc
See doc-8 for full feature planning context.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 'b' key prompts for query name and saves
- [ ] #2 Config schema extended with savedQueries field
- [ ] #3 Saved tab restored in sidebar
- [ ] #4 Queries grouped by table name in sidebar
- [ ] #5 Enter on saved query executes immediately
- [ ] #6 Queries isolated by AWS profile
- [ ] #7 Can delete saved queries from sidebar
- [ ] #8 Column preferences saved and restored if available
<!-- AC:END -->
