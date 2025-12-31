import { useCallback } from 'react'
import type { FilterCondition } from '../schemas/query-params.js'
import {
	buildFilterExpression,
	parseDynamoDBError,
	type ScanResult,
	scan,
} from '../services/dynamodb/index.js'
import { type ScanState, useAppStore } from './app-store.js'

export type { ScanState }

export function useScan(tableName: string) {
	const { profile, region, pageSize, getScanState, setScanState } = useAppStore()
	const state = getScanState(tableName)

	const updateState = useCallback(
		(updates: Partial<ScanState>) => {
			const currentState = getScanState(tableName)
			setScanState(tableName, { ...currentState, ...updates })
		},
		[tableName, getScanState, setScanState],
	)

	const executeScan = useCallback(
		async (
			options: { filterConditions?: FilterCondition[]; indexName?: string; reset?: boolean } = {},
		) => {
			const { filterConditions, indexName, reset = false } = options

			// Read current state directly - no stale closure with getScanState
			const currentState = getScanState(tableName)
			const filtersToUse = filterConditions ?? currentState.filterConditions
			const indexToUse = indexName !== undefined ? indexName : currentState.indexName
			const startKey = reset ? undefined : currentState.lastEvaluatedKey

			setScanState(tableName, {
				...currentState,
				isLoading: true,
				error: null,
				...(reset
					? {
							items: [],
							lastEvaluatedKey: undefined,
							hasMore: true,
							scannedCount: 0,
							filterConditions: filtersToUse,
							indexName: indexToUse,
						}
					: {}),
			})

			const filterParams = buildFilterExpression(filtersToUse)

			try {
				const result: ScanResult = await scan(
					{
						tableName,
						indexName: indexToUse,
						limit: pageSize,
						filterExpression: filterParams?.filterExpression,
						expressionAttributeNames: filterParams?.expressionAttributeNames,
						expressionAttributeValues: filterParams?.expressionAttributeValues,
						exclusiveStartKey: startKey,
					},
					{ profile, region },
				)

				const prevState = getScanState(tableName)
				setScanState(tableName, {
					...prevState,
					items: reset ? result.items : [...prevState.items, ...result.items],
					lastEvaluatedKey: result.lastEvaluatedKey,
					hasMore: result.lastEvaluatedKey !== undefined,
					scannedCount: (reset ? 0 : prevState.scannedCount) + result.scannedCount,
					isLoading: false,
					initialized: true,
				})

				return result
			} catch (err) {
				const prevState = getScanState(tableName)
				setScanState(tableName, {
					...prevState,
					error: parseDynamoDBError(err),
					isLoading: false,
					initialized: true,
				})
				return null
			}
		},
		[tableName, profile, region, pageSize, getScanState, setScanState],
	)

	const fetchNextPage = useCallback(() => executeScan({ reset: false }), [executeScan])

	const refresh = useCallback(
		(filterConditions?: FilterCondition[], indexName?: string) =>
			executeScan({ filterConditions, indexName, reset: true }),
		[executeScan],
	)

	const clearFilters = useCallback(() => {
		updateState({ filterConditions: [], indexName: undefined })
		return executeScan({ filterConditions: [], indexName: undefined, reset: true })
	}, [executeScan, updateState])

	const reset = useCallback(() => {
		setScanState(tableName, {
			items: [],
			isLoading: false,
			error: null,
			hasMore: true,
			lastEvaluatedKey: undefined,
			scannedCount: 0,
			filterConditions: [],
			indexName: undefined,
			initialized: false,
		})
	}, [tableName, setScanState])

	return {
		...state,
		executeScan,
		fetchNextPage,
		refresh,
		clearFilters,
		reset,
	}
}
