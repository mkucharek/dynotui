---
title: "Phase 2: AWS Services Layer"
status: Done
labels: [aws, core]
---

# Phase 2: AWS Services Layer

Implement DynamoDB operations with SDK v3.

## Tasks
- [x] `src/services/dynamodb/client.ts` - client factory w/ profile/region
- [x] `src/services/dynamodb/tables.ts` - ListTables, DescribeTable
- [x] `src/services/dynamodb/scan.ts` - Scan w/ pagination (LastEvaluatedKey)
- [x] `src/services/dynamodb/query.ts` - Query by PK, optional SK
- [x] `src/services/aws-config.ts` - profile/region management
- [x] `src/schemas/config.ts` - Zod schema for CLI config
- [x] `src/schemas/query-params.ts` - Zod schema for query/scan params
- [x] Unit tests for all services (mock AWS SDK)

## Acceptance
- Services can list tables from real AWS account
- Pagination works (next page returns new items)
- Unit tests pass with mocked SDK
- 60%+ coverage on services

## Refs
- docs: [[architecture]]
- depends: [[phase-1-project-setup]]
