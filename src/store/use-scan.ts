import { useCallback, useRef, useState } from 'react'
import type { FilterCondition } from '../schemas/query-params.js'
import {
	buildFilterExpression,
	type ParsedDynamoDBError,
	parseDynamoDBError,
	type ScanResult,
	scan,
} from '../services/dynamodb/index.js'
import { useAppStore } from './app-store.js'

export type ScanState = {
	items: Record<string, unknown>[]
	isLoading: boolean
	error: ParsedDynamoDBError | null
	hasMore: boolean
	lastEvaluatedKey: Record<string, unknown> | undefined
	scannedCount: number
	filterConditions: FilterCondition[]
}

export function useScan(tableName: string) {
	const { profile, region, pageSize } = useAppStore()

	const [state, setState] = useState<ScanState>({
		items: [],
		isLoading: false,
		error: null,
		hasMore: true,
		lastEvaluatedKey: undefined,
		scannedCount: 0,
		filterConditions: [],
	})

	// Use refs to avoid stale closure issues in pagination
	const filterConditionsRef = useRef<FilterCondition[]>([])
	const lastEvaluatedKeyRef = useRef<Record<string, unknown> | undefined>(undefined)

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

			setState((prev) => ({
				...prev,
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
			}))

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

				setState((prev) => ({
					...prev,
					items: reset ? result.items : [...prev.items, ...result.items],
					lastEvaluatedKey: result.lastEvaluatedKey,
					hasMore: result.lastEvaluatedKey !== undefined,
					scannedCount: (reset ? 0 : prev.scannedCount) + result.scannedCount,
					isLoading: false,
				}))

				return result
			} catch (err) {
				setState((prev) => ({
					...prev,
					error: parseDynamoDBError(err),
					isLoading: false,
				}))
				return null
			}
		},
		[tableName, profile, region, pageSize],
	)

	const fetchNextPage = useCallback(() => executeScan({ reset: false }), [executeScan])

	const refresh = useCallback(
		(filterConditions?: FilterCondition[]) => executeScan({ filterConditions, reset: true }),
		[executeScan],
	)

	const clearFilters = useCallback(() => {
		filterConditionsRef.current = []
		setState((prev) => ({ ...prev, filterConditions: [] }))
		return executeScan({ filterConditions: [], reset: true })
	}, [executeScan])

	const reset = useCallback(() => {
		filterConditionsRef.current = []
		lastEvaluatedKeyRef.current = undefined
		setState({
			items: [],
			isLoading: false,
			error: null,
			hasMore: true,
			lastEvaluatedKey: undefined,
			scannedCount: 0,
			filterConditions: [],
		})
	}, [])

	return {
		...state,
		executeScan,
		fetchNextPage,
		refresh,
		clearFilters,
		reset,
	}
}
