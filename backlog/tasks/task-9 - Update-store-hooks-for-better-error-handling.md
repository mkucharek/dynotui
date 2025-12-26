---
id: task-9
title: Update store hooks for better error handling
status: Done
assignee: []
created_date: '2025-12-26 16:50'
updated_date: '2025-12-26 17:05'
labels:
  - query
  - error-handling
dependencies:
  - task-6
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update useQuery and useScan hooks to use structured error handling.

Reference: doc-2 (DynamoDB Query Resilience Plan)

Modify `src/store/use-query.ts` and `src/store/use-scan.ts`:
- Import parseDynamoDBError
- Change error state from string to structured: { type, message, details }
- Update catch blocks to use parseDynamoDBError()
- UI can show different styles based on error type
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 useQuery stores structured error object
- [x] #2 useScan stores structured error object
- [x] #3 Error type available for UI styling decisions
- [x] #4 Existing error display still works
<!-- AC:END -->
