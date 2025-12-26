---
id: doc-3
title: Settings Panel Design
type: other
created_date: '2025-12-26 17:38'
---
# Settings Panel Design

## Overview
Add a settings view accessible from home (`s` key) with profile, region, and page size settings.

## Architecture

### New View Type
- Add `'settings'` to View union in `src/types/navigation.ts`
- `SettingsViewState = { view: 'settings' }`

### Settings View Structure
Similar to HomeView with modes:
- `browsing` - show settings list
- `selecting-profile` / `selecting-region` / `selecting-pageSize`

Settings list:
```
Profile: [current]     → InlineSelector with AWS profiles
Region: [current]      → InlineSelector with regions  
Page Size: [current]   → InlineSelector with [25, 50, 100, 200]
```

Bindings: `Esc` go back, `Enter` select setting, `j/k` navigate

### Config Extension
Add `pageSize?: number` to UserConfig type and persist to `~/.config/dynotui/config.json`

## Files to Modify
| File | Change |
|------|--------|
| `src/services/user-config.ts` | Add pageSize field |
| `src/store/app-store.ts` | Add pageSize state + action |
| `src/types/navigation.ts` | Add settings view type |
| `src/views/settings.tsx` | New file - settings UI |
| `src/views/index.ts` | Export SettingsView |
| `src/store/use-navigation.ts` | Add navigateToSettings |
| `src/views/home.tsx` | Add 's' keybinding |
| `src/index.tsx` | Render settings view |
| `src/store/use-scan.ts` | Use store pageSize |
| `src/store/use-query.ts` | Use store pageSize |
