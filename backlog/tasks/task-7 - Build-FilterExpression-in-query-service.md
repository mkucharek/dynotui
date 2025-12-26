---
id: task-7
title: Build FilterExpression in query service
status: Done
assignee: []
created_date: '2025-12-26 16:50'
updated_date: '2025-12-26 16:55'
labels:
  - query
  - service
dependencies:
  - task-5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement FilterExpression building from filter conditions in query service.

Reference: doc-2 (DynamoDB Query Resilience Plan)

Modify `src/services/dynamodb/query.ts`:
- Add buildFilterExpression() function
- Generate unique placeholders (#f0, :f0, etc.)
- Handle all operators: =, <>, <, <=, >, >=, BETWEEN, begins_with(), contains(), attribute_exists(), attribute_not_exists()
- Merge with existing ExpressionAttributeNames/Values
- Update query() to include FilterExpression in QueryCommand
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 buildFilterExpression() converts conditions to DynamoDB expression
- [x] #2 All 11 filter operators handled correctly
- [x] #3 Expression placeholders don't conflict with key condition placeholders
- [x] #4 FilterExpression passed to QueryCommand when conditions present
- [x] #5 Unit tests cover all operators and edge cases
<!-- AC:END -->
