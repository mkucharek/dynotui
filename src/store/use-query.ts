import { useCallback, useState } from 'react'
import {
	type ParsedDynamoDBError,
	type QueryParams,
	type QueryResult,
	parseDynamoDBError,
	query,
} from '../services/dynamodb/index.js'
import { useAppStore } from './app-store.js'

export type QueryState = {
	items: Record<string, unknown>[]
	isLoading: boolean
	error: ParsedDynamoDBError | null
	hasMore: boolean
	lastEvaluatedKey: Record<string, unknown> | undefined
	scannedCount: number
}

export function useQuery(tableName: string) {
	const { profile, region, pageSize } = useAppStore()

	const [state, setState] = useState<QueryState>({
		items: [],
		isLoading: false,
		error: null,
		hasMore: true,
		lastEvaluatedKey: undefined,
		scannedCount: 0,
	})

	const [queryParams, setQueryParams] = useState<Omit<QueryParams, 'tableName'> | null>(null)

	const executeQuery = useCallback(
		async (params: Omit<QueryParams, 'tableName'>, reset = false) => {
			setQueryParams(params)

			setState((prev) => ({
				...prev,
				isLoading: true,
				error: null,
				...(reset
					? { items: [], lastEvaluatedKey: undefined, hasMore: true, scannedCount: 0 }
					: {}),
			}))

			try {
				const result: QueryResult = await query(
					{
						tableName,
						...params,
						limit: params.limit ?? pageSize,
						exclusiveStartKey: reset ? undefined : state.lastEvaluatedKey,
					},
					{ profile, region },
				)

				setState((prev) => ({
					...prev,
					items: reset ? result.items : [...prev.items, ...result.items],
					lastEvaluatedKey: result.lastEvaluatedKey,
					hasMore: result.lastEvaluatedKey !== undefined,
					scannedCount: prev.scannedCount + result.scannedCount,
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
		[tableName, profile, region, pageSize, state.lastEvaluatedKey],
	)

	const fetchNextPage = useCallback(async () => {
		if (!queryParams) return null
		return executeQuery(queryParams, false)
	}, [executeQuery, queryParams])

	const refresh = useCallback(async () => {
		if (!queryParams) return null
		return executeQuery(queryParams, true)
	}, [executeQuery, queryParams])

	const reset = useCallback(() => {
		setQueryParams(null)
		setState({
			items: [],
			isLoading: false,
			error: null,
			hasMore: true,
			lastEvaluatedKey: undefined,
			scannedCount: 0,
		})
	}, [])

	return {
		...state,
		queryParams,
		executeQuery,
		fetchNextPage,
		refresh,
		reset,
	}
}
