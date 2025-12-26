---
id: task-6
title: Create DynamoDB error handler utility
status: Done
assignee: []
created_date: '2025-12-26 16:49'
updated_date: '2025-12-26 16:53'
labels:
  - query
  - error-handling
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create error parsing utility for user-friendly DynamoDB error messages.

Reference: doc-2 (DynamoDB Query Resilience Plan)

Create `src/services/dynamodb/errors.ts`:
- DynamoDBErrorType: validation, throttled, not_found, access_denied, unknown
- parseDynamoDBError(error): { type, message, details }
- Map AWS SDK error names to user-friendly messages:
  - ValidationException → "Invalid expression: {details}"
  - ProvisionedThroughputExceededException → "Request throttled. Try again."
  - ResourceNotFoundException → "Table or index not found"
  - AccessDeniedException → "Permission denied"
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 parseDynamoDBError() returns structured error object
- [x] #2 All common DynamoDB errors mapped to user-friendly messages
- [x] #3 Unknown errors handled gracefully
- [x] #4 Unit tests cover all error types
<!-- AC:END -->
