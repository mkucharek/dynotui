---
id: task-10
title: Integrate filter builder into QueryForm
status: Done
assignee: []
created_date: '2025-12-26 16:50'
updated_date: '2025-12-26 17:07'
labels:
  - query
  - ui
dependencies:
  - task-8
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add FilterBuilder component to QueryForm and pass filter conditions in submit.

Reference: doc-2 (DynamoDB Query Resilience Plan)

Modify `src/components/forms/query-form.tsx`:
- Import and render FilterBuilder after sort key section
- Update form state to include filterConditions
- Pass filterConditions in onSubmit params
- Update QueryFormProps if needed
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 FilterBuilder visible in QueryForm after sort key fields
- [x] #2 Filter conditions included in form submission
- [x] #3 Navigation flows naturally through all form sections
<!-- AC:END -->
