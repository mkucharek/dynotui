import { useCallback, useRef } from 'react'
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

	// Use refs to avoid stale closure issues in pagination
	const filterConditionsRef = useRef<FilterCondition[]>(state.filterConditions)
	const lastEvaluatedKeyRef = useRef<Record<string, unknown> | undefined>(state.lastEvaluatedKey)

	// Sync refs with current state
	filterConditionsRef.current = state.filterConditions
	lastEvaluatedKeyRef.current = state.lastEvaluatedKey

	const updateState = useCallback(
		(updates: Partial<ScanState>) => {
			const currentState = getScanState(tableName)
			setScanState(tableName, { ...currentState, ...updates })
		},
		[tableName, getScanState, setScanState],
	)

	const executeScan = useCallback(
		async (options: { filterConditions?: FilterCondition[]; reset?: boolean } = {}) => {
			const { filterConditions, reset = false } = options

			// Update ref if new filters explicitly provided
			if (filterConditions !== undefined) {
				filterConditionsRef.current = filterConditions
			}
			// Always use ref value (it's always current)
			const filtersToUse = filterConditionsRef.current
			const startKey = reset ? undefined : lastEvaluatedKeyRef.current

			const currentState = getScanState(tableName)
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
							filterConditions: filterConditionsRef.current,
						}
					: {}),
			})

			// Build filter expression from conditions
			const filterParams = buildFilterExpression(filtersToUse)

			try {
				const result: ScanResult = await scan(
					{
						tableName,
						limit: pageSize,
						filterExpression: filterParams?.filterExpression,
						expressionAttributeNames: filterParams?.expressionAttributeNames,
						expressionAttributeValues: filterParams?.expressionAttributeValues,
						exclusiveStartKey: startKey,
					},
					{ profile, region },
				)

				// Update ref for next pagination call
				lastEvaluatedKeyRef.current = result.lastEvaluatedKey

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
		(filterConditions?: FilterCondition[]) => executeScan({ filterConditions, reset: true }),
		[executeScan],
	)

	const clearFilters = useCallback(() => {
		filterConditionsRef.current = []
		updateState({ filterConditions: [] })
		return executeScan({ filterConditions: [], reset: true })
	}, [executeScan, updateState])

	const reset = useCallback(() => {
		filterConditionsRef.current = []
		lastEvaluatedKeyRef.current = undefined
		setScanState(tableName, {
			items: [],
			isLoading: false,
			error: null,
			hasMore: true,
			lastEvaluatedKey: undefined,
			scannedCount: 0,
			filterConditions: [],
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
