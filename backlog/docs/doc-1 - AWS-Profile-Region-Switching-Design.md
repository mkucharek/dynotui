---
id: doc-1
title: AWS Profile/Region Switching Design
type: other
created_date: '2025-12-26 16:26'
---
# AWS Profile/Region Switching in Home View

## Overview
Add ability to switch AWS profiles and regions from the home view. Switching resets client and refreshes table list.

## Files to Modify

1. **`src/views/home.tsx`** - Add mode state and selector UI
2. **`src/components/layout/header.tsx`** - Add visual hint that profile/region are editable
3. **`src/services/dynamodb/client.ts`** - Export `resetClient` (if not already)

## Files to Create

1. **`src/components/forms/inline-selector.tsx`** - Reusable selector component

## Implementation Details

### InlineSelector Component
New component based on QueryForm's operator selector pattern:
- Vertical list with j/k + arrow navigation
- Enter confirms, Escape cancels
- Cyan highlight for current selection
- Shows `>` prefix for selected item

### HomeView Changes
Add mode state: `'browsing' | 'selecting-profile' | 'selecting-region'`

Key bindings (only in browsing mode):
- `p` → switch to `selecting-profile` mode
- `R` → switch to `selecting-region` mode (capital to avoid conflict with `r` refresh)

Selector callbacks:
- On profile select: `setProfile()`, `resetClient()`, `fetchTables()`
- On region select: `setRegion()`, `resetClient()`, `fetchTables()`

### Data Flow

```
User presses 'p'
  → mode = 'selecting-profile'
  → InlineSelector shows profiles
  → User selects with Enter
  → setProfile(selected)
  → resetClient()
  → fetchTables()
  → mode = 'browsing'
```

## Keybinding Summary (Home View)

| Key | Mode | Action |
|-----|------|--------|
| p | browsing | Open profile selector |
| R | browsing | Open region selector |
| j/k/↑/↓ | selecting-* | Navigate options |
| Enter | selecting-* | Confirm selection |
| Esc | selecting-* | Cancel, return to browsing |

## Edge Cases

- Empty profiles list: show message "No AWS profiles found"
- Current profile/region should be pre-selected in selector
- After switch, reset `selectedIndex` to 0 (table selection)
