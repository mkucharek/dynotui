---
id: doc-8
title: 'Feature Planning: Table UX & CRUD Operations'
type: other
created_date: '2026-01-09 21:11'
updated_date: '2026-01-09 21:18'
---
# Feature Planning: Table UX & CRUD Operations

This document captures design decisions for major features planned for dynotui.

## Feature 1: Horizontal Scroll & Column Management

**Problem**: Currently limited to 5 auto-selected columns, no way to see all attributes.

**Solution**: Horizontal scrolling table with frozen key columns.

### Decisions
- **Scroll behavior**: PK/SK columns frozen on left, other columns scroll horizontally
- **Column widths**: Auto-fit to content (existing responsive logic)
- **Navigation**: h/l and ←/→ for horizontal scroll, j/k for row navigation
- **Column preferences**: Query-scoped only (reset when leaving saved query)
- **No column picker UI** - all columns visible via scroll

---

## Feature 2: Item Edit

**Problem**: No way to modify existing items.

**Solution**: Full-screen JSON editor modal accessible from item detail view.

### Decisions
- **Access point**: Item detail view only (Enter item → edit from there)
- **Editor type**: Dual JSON editor (standard JSON + DynamoDB JSON) with toggle
- **Default format**: Standard JSON, auto-convert on toggle
- **Key handling**: PK/SK fields are read-only (cannot change keys)
- **Undo support**: None (Cancel discards all changes)
- **Confirmation**: Required before saving
- **Error handling**: Modal with details + retry option
- **Component**: Single reusable JSONEditor component for edit and create

---

## Feature 3: Item Create

**Problem**: No way to add new items.

**Solution**: Create action from table view using JSON editor.

### Decisions
- **Access point**: Table view (c key to create)
- **Initial content**: Pre-populated with table's key schema (PK + SK fields)
- **Clone support**: Also support cloning selected item (full copy, user changes keys)
- **Validation**: Key validation only (ensure PK/SK present and non-empty)
- **Editor**: Same JSONEditor component as edit

---

## Feature 4: Item Delete

**Problem**: No way to remove items.

**Solution**: Single delete from item view, batch delete from table view.

### Decisions
- **Single delete**: Available from item detail view
- **Batch delete**: Available from table view with multi-select
- **Selection UX**: Spacebar to toggle selection while navigating
- **Delete trigger**: d key opens preview modal showing items to delete
- **Confirmation**: Modal with count, Enter to confirm
- **Error handling**: Modal with details + retry option

---

## Feature 5: Saved Queries

**Problem**: Cannot save/reload frequently used queries.

**Solution**: Bookmark system with sidebar tab for saved queries.

### Decisions
- **Scope**: Table-specific (each saved query belongs to one table)
- **Storage**: In main config.json, organized by profile
- **Content saved**: Query params + column display preferences
- **Naming**: Custom name required when saving
- **Save hotkey**: b (bookmark) to save current query
- **UI location**: Restored Saved tab in sidebar
- **Display**: All tables grouped by table name
- **Load behavior**: Execute immediately when selected
- **Profile isolation**: Queries separated by AWS profile

---

## Feature 6: Auto-Load All Results

**Problem**: Loading large result sets requires repeated 'n' key presses.

**Solution**: Toggle keybinding to auto-load all remaining pages.

### Decisions
- **Keybinding**: A to toggle auto-load on/off
- **Behavior**: Keep loading until done, A again to stop
- **Safety**: No hard limit - user controls via toggle
- **Visual feedback**: Live table updates + footer shows "Loading... N items"
- **Interaction**: Table remains navigable during auto-load

---

## Feature 7: Table State Reset on Change

**Problem**: Switching tables may leave stale filters or query state.

**Solution**: Full reset when changing tables.

### Decisions
- **Reset scope**: Clear filters, reset to scan mode, cursor to row 0
- **Table change**: Full reset + fresh scan
- **Saved query load**: Apply query params + cursor to row 0
- **Empty table**: Handle gracefully (no selection crash)

---

## Implementation Order

1. **task-57** - Horizontal scroll (foundation for column display)
2. **task-58** - JSONEditor component (foundation for CRUD)
3. **task-59** - Item create (uses JSONEditor)
4. **task-60** - Item edit (uses JSONEditor with read-only keys)
5. **task-61** - Item delete (adds selection mode)
6. **task-62** - Saved queries (depends on horizontal scroll for column prefs)
7. **task-63** - Auto-load toggle
8. **task-64** - Table state reset

---

## Technical Notes

### JSONEditor Component
- Reusable across create/edit flows
- Supports two modes: standard JSON and DynamoDB AttributeValue format
- Auto-conversion between formats
- No undo/redo (simple implementation)
- Full-screen takeover using existing mode pattern

### Config Schema Extension
```typescript
type UserConfig = {
  profile?: string
  region?: string
  pageSize?: number
  savedQueries?: {
    [profile: string]: {
      [tableName: string]: SavedQuery[]
    }
  }
}

type SavedQuery = {
  name: string
  type: 'scan' | 'query'
  params: QueryParams | ScanParams
  columns?: string[]  // column display order
  createdAt: string
}
```

### Keybinding Summary
- h/l, ←/→: Horizontal scroll
- j/k, ↑/↓: Vertical navigation
- c: Create new item (table view)
- C: Clone selected item (table view)
- e: Edit item (item view)
- d: Delete (preview modal)
- Space: Toggle selection (table view)
- b: Bookmark/save current query
- A: Toggle auto-load all pages
