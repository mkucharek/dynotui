---
id: doc-5
title: Layout Redesign - Split Panel Architecture
type: other
created_date: '2025-12-28 11:20'
---
# Layout Redesign - Split Panel Architecture

## Overview

Redesign DynoTUI from single-view navigation to a persistent split-panel layout with sidebar + main content area.

## Target Layout

```
┌───────────────────────┬─────────────────────────────────────────────────────┐
│ [1] Profiles          │  Table: users                          [Scan Mode] │
│  ─────────────────────│─────────────────────────────────────────────────────│
│    default          ◄ │  ┌─────────────────────────────────────────────────┐│
│  > production         │  │ PK         │ SK        │ name      │ status    ││
│    staging            │  ├─────────────────────────────────────────────────┤│
│                       │  │ user#001   │ profile   │ John Doe  │ active    ││
│ [2] Regions           │  │ user#002   │ profile   │ Jane Doe  │ active    ││
│  ─────────────────────│  │ user#003   │ profile   │ Bob Smith │ inactive  ││
│    us-east-1        ◄ │  │ ...        │ ...       │ ...       │ ...       ││
│    us-west-2          │  └─────────────────────────────────────────────────┘│
│  > eu-west-1          │                                                     │
│                       │  Items: 156 (showing 50)                            │
│ [3] Tables (23)       │                                                     │
│  ─────────────────────│                                                     │
│  > users            ◄ │                                                     │
│    orders             │                                                     │
│    products           │                                                     │
└───────────────────────┴─────────────────────────────────────────────────────┘
│ [j/k] Navigate  [Enter] Select  [Tab] Switch Panel  [s] Scan  [q] Query     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Decisions

1. **Sidebar sections**: Profiles → Regions → Tables (in that order)
2. **Section headers**: Include shortcuts `[1]`, `[2]`, `[3]`
3. **Active indicator**: `◄` marks currently active item in each list
4. **Cursor indicator**: `>` shows current selection position
5. **Full-screen**: Layout uses 100% width and height
6. **Focus management**: `Tab` switches between sidebar and main panel, `1/2/3` switches sidebar sections

## Interaction Model

- `1`/`2`/`3` - Focus sidebar section (Profiles/Regions/Tables)
- `Tab` - Switch focus between sidebar and main panel
- `j`/`k` - Navigate within focused list
- `Enter` - Select item (profile/region changes context, table opens in main)
- `Esc` - Back navigation in main panel

## Components to Create

1. `SplitLayout` - Two-column container
2. `Sidebar` - Contains all three sections
3. `SidebarSection` - Reusable list section with header
4. `MainPanel` - Content area (table view, item view, empty state)

## Navigation Changes

- Remove `HomeView` - functionality moves to sidebar
- Main panel shows: empty state, TableView, ItemView, or SettingsView
- Sidebar always visible
- Focus state tracked in store
