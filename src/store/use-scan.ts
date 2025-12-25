import { useCallback, useState } from 'react'
import { type ScanParams, type ScanResult, scan } from '../services/dynamodb/index.js'
import { useAppStore } from './app-store.js'

export type ScanState = {
	items: Record<string, unknown>[]
	isLoading: boolean
	error: string | null
	hasMore: boolean
	lastEvaluatedKey: Record<string, unknown> | undefined
	scannedCount: number
}

export function useScan(tableName: string) {
	const { profile, region } = useAppStore()

	const [state, setState] = useState<ScanState>({
		items: [],
		isLoading: false,
		error: null,
		hasMore: true,
		lastEvaluatedKey: undefined,
		scannedCount: 0,
	})

	const executeScan = useCallback(
		async (params?: Partial<Omit<ScanParams, 'tableName'>>, reset = false) => {
			setState((prev) => ({
				...prev,
				isLoading: true,
				error: null,
				...(reset
					? { items: [], lastEvaluatedKey: undefined, hasMore: true, scannedCount: 0 }
					: {}),
			}))

			try {
				const result: ScanResult = await scan(
					{
						tableName,
						limit: params?.limit ?? 25,
						filterExpression: params?.filterExpression,
						expressionAttributeNames: params?.expressionAttributeNames,
						expressionAttributeValues: params?.expressionAttributeValues,
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
					error: err instanceof Error ? err.message : 'Scan failed',
					isLoading: false,
				}))
				return null
			}
		},
		[tableName, profile, region, state.lastEvaluatedKey],
	)

	const fetchNextPage = useCallback(() => executeScan(undefined, false), [executeScan])

	const refresh = useCallback(
		(params?: Partial<Omit<ScanParams, 'tableName'>>) => executeScan(params, true),
		[executeScan],
	)

	const reset = useCallback(() => {
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
		executeScan,
		fetchNextPage,
		refresh,
		reset,
	}
}
