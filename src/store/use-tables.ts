import { useCallback, useState } from 'react'
import { getTableInfo, listTables, type TableInfo } from '../services/dynamodb/index.js'
import { useAppStore } from './app-store.js'

export type TablesState = {
	tables: string[]
	tableInfoCache: Map<string, TableInfo>
	isLoading: boolean
	error: string | null
	hasMore: boolean
	lastTableName: string | undefined
}

export function useTables() {
	const { profile, region } = useAppStore()

	const [state, setState] = useState<TablesState>({
		tables: [],
		tableInfoCache: new Map(),
		isLoading: false,
		error: null,
		hasMore: true,
		lastTableName: undefined,
	})

	const fetchTables = useCallback(
		async (reset = false) => {
			setState((prev) => ({
				...prev,
				isLoading: true,
				error: null,
				...(reset ? { tables: [], lastTableName: undefined, hasMore: true } : {}),
			}))

			try {
				const result = await listTables(
					{ profile, region },
					reset ? undefined : state.lastTableName,
				)

				setState((prev) => ({
					...prev,
					tables: reset ? result.tables : [...prev.tables, ...result.tables],
					lastTableName: result.lastTableName,
					hasMore: result.lastTableName !== undefined,
					isLoading: false,
				}))
			} catch (err) {
				setState((prev) => ({
					...prev,
					error: err instanceof Error ? err.message : 'Failed to fetch tables',
					isLoading: false,
				}))
			}
		},
		[profile, region, state.lastTableName],
	)

	const fetchTableInfo = useCallback(
		async (tableName: string): Promise<TableInfo | null> => {
			const cached = state.tableInfoCache.get(tableName)
			if (cached) return cached

			try {
				const info = await getTableInfo(tableName, { profile, region })
				setState((prev) => {
					const newCache = new Map(prev.tableInfoCache)
					newCache.set(tableName, info)
					return { ...prev, tableInfoCache: newCache }
				})
				return info
			} catch {
				return null
			}
		},
		[profile, region, state.tableInfoCache],
	)

	const refresh = useCallback(() => fetchTables(true), [fetchTables])

	return {
		...state,
		fetchTables,
		fetchTableInfo,
		refresh,
	}
}
