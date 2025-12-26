---
id: doc-2
title: DynamoDB Query Resilience Plan
type: other
created_date: '2025-12-26 16:49'
---
# DynamoDB Query Resilience Plan

**Goal:** Add FilterExpression to Query + improve error handling
**UI Approach:** Structured filter builder (attribute/operator/value selector)

## Gap Analysis Summary

### Current State
- Query: KeyConditionExpression, pagination, ScanIndexForward, GSI support ✅
- Missing: FilterExpression for Query, structured error handling

### DynamoDB Query API Features
- FilterExpression: Post-query filtering on non-key attributes
- Operators: =, <>, <, <=, >, >=, BETWEEN, begins_with, contains, attribute_exists

## Implementation Overview

7 steps total:
1. Schema types - Add `filterConditions` array schema
2. Query service - Build FilterExpression from conditions
3. Filter builder UI - New structured component
4. QueryForm integration - Add filter builder section
5. Error handler - Parse DynamoDB errors
6. Store hooks - Better error handling
7. Tests - Cover all new functionality

## Files to Modify

| File | Action |
|------|--------|
| `src/schemas/query-params.ts` | Add filterConditions schema |
| `src/services/dynamodb/query.ts` | Add FilterExpression building |
| `src/services/dynamodb/errors.ts` | NEW - Error parsing utility |
| `src/components/forms/filter-builder.tsx` | NEW - Structured filter UI |
| `src/components/forms/query-form.tsx` | Integrate filter builder |
| `src/store/use-query.ts` | Better error handling |
| `src/store/use-scan.ts` | Better error handling |

## DynamoDB Filter Operators Reference

| Operator | Expression | Notes |
|----------|------------|-------|
| `=` | `#attr = :val` | Equality |
| `<>` | `#attr <> :val` | Not equal |
| `<` | `#attr < :val` | Less than |
| `<=` | `#attr <= :val` | Less or equal |
| `>` | `#attr > :val` | Greater than |
| `>=` | `#attr >= :val` | Greater or equal |
| `BETWEEN` | `#attr BETWEEN :lo AND :hi` | Range inclusive |
| `begins_with` | `begins_with(#attr, :val)` | String prefix |
| `contains` | `contains(#attr, :val)` | String/set contains |
| `exists` | `attribute_exists(#attr)` | Attribute present |
| `not_exists` | `attribute_not_exists(#attr)` | Attribute absent |

## Scope

**In scope:** FilterExpression for Query, structured builder UI, error handling
**Out of scope:** ProjectionExpression, ConsistentRead, Select COUNT (future work)
