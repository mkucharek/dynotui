---
id: doc-4
title: Scan Filter Support Design
type: other
created_date: '2025-12-26 19:28'
updated_date: '2025-12-26 19:48'
---
# Scan Filter Support Design

## Overview
Add structured filtering UI for scan mode, reusing existing FilterBuilder component.

## Key Files
- `src/components/forms/filter-builder.tsx` - existing filter UI (reuse)
- `src/components/forms/query-form.tsx` - pattern reference
- `src/views/table-view.tsx` - integration point
- `src/store/use-scan.ts` - hook to receive filter params
- `src/services/dynamodb/query.ts` - has `buildFilterExpression()` to reuse

## Implementation Steps

### 1. Create ScanFilterForm component
**File:** `src/components/forms/scan-filter-form.tsx`
- Wrapper around FilterBuilder
- Props: `onSubmit(filters: FilterCondition[])`, `onCancel()`
- Simpler than QueryForm (no key condition fields)

### 2. Export buildFilterExpression from query service
**File:** `src/services/dynamodb/query.ts`
- Export existing `buildFilterExpression` function (currently private)

### 3. Re-export from dynamodb index
**File:** `src/services/dynamodb/index.ts`
- Re-export `buildFilterExpression` for use by useScan hook

### 4. Update useScan hook
**File:** `src/store/use-scan.ts`
- Store filterConditions for pagination/refresh
- Accept FilterCondition[] and convert to expression via buildFilterExpression
- Use refs to avoid stale closure issues during pagination

### 5. Update table-view for scan-filter mode
**File:** `src/views/table-view.tsx`
- Add 'scan-filter-form' mode type
- Press 'f' in scan mode → opens filter form
- Submit → refresh scan with filters
- Update footer bindings to show 'f' for Filter

### 6. Export new component
**File:** `src/components/index.ts`
- Add ScanFilterForm export

## UX Flow
1. User enters table (default scan mode)
2. Press 'f' → opens ScanFilterForm
3. Add filters using FilterBuilder UI (attribute/operator/value)
4. Submit → scan with FilterExpression
5. 'f' again → modify existing filters
6. 's' → clears filters, back to unfiltered scan

## Bug Fixes Applied
- **Pagination with filters**: Used refs (`filterConditionsRef`, `lastEvaluatedKeyRef`) to avoid stale closure issues when paginating with 'n' key
- **Empty ExpressionAttributeValues**: `buildFilterExpression` now returns `undefined` instead of empty object for `expressionAttributeValues` when using operators like `attribute_exists`/`attribute_not_exists` that don't need values (DynamoDB rejects empty objects)
