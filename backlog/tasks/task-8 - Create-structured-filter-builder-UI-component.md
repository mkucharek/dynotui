---
id: task-8
title: Create structured filter builder UI component
status: Done
assignee: []
created_date: '2025-12-26 16:50'
updated_date: '2025-12-26 17:04'
labels:
  - query
  - ui
dependencies:
  - task-5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a new FilterBuilder component with structured attribute/operator/value inputs.

Reference: doc-2 (DynamoDB Query Resilience Plan)

Create `src/components/forms/filter-builder.tsx`:
- List of filter condition rows
- Each row: attribute input, operator selector, value input(s)
- Tab navigation between conditions
- j/k for operator selection (like QueryForm)
- Add/remove filter rows with keyboard shortcuts
- Auto-suggest attribute names from fetched items (optional)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 FilterBuilder component renders filter condition rows
- [x] #2 Tab navigates between fields
- [x] #3 j/k cycles operator selection
- [x] #4 Can add new filter conditions
- [x] #5 Can remove filter conditions
- [x] #6 Returns filterConditions array on submit
<!-- AC:END -->
