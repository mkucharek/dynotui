---
id: task-1
title: Create InlineSelector component
status: Done
assignee: []
created_date: '2025-12-26 16:27'
updated_date: '2025-12-26 16:28'
labels:
  - feature
  - component
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create reusable selector component at `src/components/forms/inline-selector.tsx` for profile/region selection.

Props: items, selectedIndex, onSelect, onCancel, focused, title
- Vertical list with j/k + arrow navigation
- Enter confirms, Escape cancels
- Cyan highlight for current selection
- Shows `>` prefix for selected item
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Component renders list of selectable items
- [x] #2 j/k and arrow keys navigate selection
- [x] #3 Enter key confirms selection
- [x] #4 Escape key cancels
- [x] #5 Visual indicator shows current selection
<!-- AC:END -->
