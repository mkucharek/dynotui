import { type TablesState, useAppStore } from './app-store.js'

export type { TablesState }

export function useTables() {
	const tablesState = useAppStore((state) => state.tablesState)
	const fetchTables = useAppStore((state) => state.fetchTables)
	const fetchTableInfo = useAppStore((state) => state.fetchTableInfo)
	const clearTables = useAppStore((state) => state.clearTables)

	return {
		...tablesState,
		fetchTables,
		fetchTableInfo,
		fetchNextPage: () => fetchTables(false),
		refresh: () => fetchTables(true),
		clearTables,
	}
}
