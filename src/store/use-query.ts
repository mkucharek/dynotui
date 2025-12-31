import { useCallback } from 'react'
import {
	parseDynamoDBError,
	type QueryParams,
	type QueryResult,
	query,
} from '../services/dynamodb/index.js'
import {
	createInitialQueryState,
	type QueryParamsCache,
	type QueryState,
	useAppStore,
} from './app-store.js'

export type { QueryState, QueryParamsCache }

export function useQuery(tableName: string) {
	const { profile, region, pageSize, getQueryState, setQueryState } = useAppStore()
	const state = getQueryState(tableName)

	const executeQuery = useCallback(
		async (params: Omit<QueryParams, 'tableName'>, reset = false) => {
			// Read current state directly - no stale closure with getQueryState
			const currentState = getQueryState(tableName)
			const startKey = reset ? undefined : currentState.lastEvaluatedKey

			// Cache query params for pagination
			const queryParamsCache: QueryParamsCache = {
				indexName: params.indexName,
				partitionKey: params.partitionKey,
				sortKey: params.sortKey,
				filterConditions: params.filterConditions,
				limit: params.limit,
				scanIndexForward: params.scanIndexForward,
			}

			setQueryState(tableName, {
				...currentState,
				isLoading: true,
				error: null,
				queryParams: queryParamsCache,
				...(reset
					? { items: [], lastEvaluatedKey: undefined, hasMore: true, scannedCount: 0 }
					: {}),
			})

			try {
				const result: QueryResult = await query(
					{
						tableName,
						...params,
						limit: params.limit ?? pageSize,
						exclusiveStartKey: startKey,
					},
					{ profile, region },
				)

				const prevState = getQueryState(tableName)
				setQueryState(tableName, {
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
				const prevState = getQueryState(tableName)
				setQueryState(tableName, {
					...prevState,
					error: parseDynamoDBError(err),
					isLoading: false,
					initialized: true,
				})
				return null
			}
		},
		[tableName, profile, region, pageSize, getQueryState, setQueryState],
	)

	const fetchNextPage = useCallback(async () => {
		const currentState = getQueryState(tableName)
		if (!currentState.queryParams) return null

		// Reconstruct params from cache
		const params: Omit<QueryParams, 'tableName'> = {
			partitionKey: currentState.queryParams.partitionKey,
			sortKey: currentState.queryParams.sortKey,
			indexName: currentState.queryParams.indexName,
			filterConditions: currentState.queryParams.filterConditions,
			limit: currentState.queryParams.limit,
			scanIndexForward: currentState.queryParams.scanIndexForward,
		}
		return executeQuery(params, false)
	}, [tableName, executeQuery, getQueryState])

	const refresh = useCallback(async () => {
		const currentState = getQueryState(tableName)
		if (!currentState.queryParams) return null

		const params: Omit<QueryParams, 'tableName'> = {
			partitionKey: currentState.queryParams.partitionKey,
			sortKey: currentState.queryParams.sortKey,
			indexName: currentState.queryParams.indexName,
			filterConditions: currentState.queryParams.filterConditions,
			limit: currentState.queryParams.limit,
			scanIndexForward: currentState.queryParams.scanIndexForward,
		}
		return executeQuery(params, true)
	}, [tableName, executeQuery, getQueryState])

	const reset = useCallback(() => {
		setQueryState(tableName, createInitialQueryState())
	}, [tableName, setQueryState])

	const applyFilters = useCallback(
		async (filterConditions: QueryParams['filterConditions']) => {
			const currentState = getQueryState(tableName)
			if (!currentState.queryParams) return null

			const params: Omit<QueryParams, 'tableName'> = {
				partitionKey: currentState.queryParams.partitionKey,
				sortKey: currentState.queryParams.sortKey,
				indexName: currentState.queryParams.indexName,
				filterConditions,
				limit: currentState.queryParams.limit,
				scanIndexForward: currentState.queryParams.scanIndexForward,
			}
			return executeQuery(params, true)
		},
		[tableName, executeQuery, getQueryState],
	)

	const clearFilters = useCallback(async () => {
		return applyFilters(undefined)
	}, [applyFilters])

	return {
		...state,
		executeQuery,
		fetchNextPage,
		refresh,
		reset,
		applyFilters,
		clearFilters,
	}
}
