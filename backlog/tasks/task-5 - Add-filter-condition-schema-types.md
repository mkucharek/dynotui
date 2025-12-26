---
id: task-5
title: Add filter condition schema types
status: Done
assignee: []
created_date: '2025-12-26 16:49'
updated_date: '2025-12-26 16:52'
labels:
  - query
  - schema
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add Zod schemas for filter conditions to support FilterExpression in queries.

Reference: doc-2 (DynamoDB Query Resilience Plan)

Add to `src/schemas/query-params.ts`:
- filterOperatorSchema: eq, ne, lt, lte, gt, gte, between, begins_with, contains, attribute_exists, attribute_not_exists
- filterConditionSchema: { attribute, operator, value, value2 }
- Add filterConditions array to queryParamsSchema
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 filterOperatorSchema exported with all 11 operators
- [x] #2 filterConditionSchema validates attribute/operator/value
- [x] #3 queryParamsSchema includes optional filterConditions array
- [x] #4 Tests added for new schema validation
<!-- AC:END -->
