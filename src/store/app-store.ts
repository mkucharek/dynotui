import { create } from 'zustand'
import type { FilterCondition } from '../schemas/query-params.js'
import { getDefaultRegion } from '../services/aws-config.js'
import type { ParsedDynamoDBError } from '../services/dynamodb/errors.js'
import { getTableInfo, listTables, type TableInfo } from '../services/dynamodb/index.js'
import { loadUserConfig, saveUserConfig } from '../services/user-config.js'
import type { ViewState } from '../types/navigation.js'

const savedConfig = loadUserConfig()

export const DEFAULT_PAGE_SIZE = 25

export type ScanState = {
	items: Record<string, unknown>[]
	isLoading: boolean
	error: ParsedDynamoDBError | null
	hasMore: boolean
	lastEvaluatedKey: Record<string, unknown> | undefined
	scannedCount: number
	filterConditions: FilterCondition[]
	initialized: boolean
}

export type TablesState = {
	tables: string[]
	tableInfoCache: Map<string, TableInfo>
	isLoading: boolean
	error: string | null
	hasMore: boolean
	lastTableName: string | undefined
	initialized: boolean
}

export type AppState = {
	// AWS config
	profile: string | undefined
	region: string
	pageSize: number

	// Navigation
	currentView: ViewState
	history: ViewState[]

	// Tables
	tablesState: TablesState

	// Scan state cache (keyed by tableName)
	scanStateCache: Map<string, ScanState>

	// Actions
	setProfile: (profile: string | undefined) => void
	setRegion: (region: string) => void
	setPageSize: (pageSize: number) => void
	navigate: (view: ViewState, from?: ViewState) => void
	goBack: () => void
	canGoBack: () => boolean

	// Tables actions
	fetchTables: (reset?: boolean) => Promise<void>
	fetchTableInfo: (tableName: string) => Promise<TableInfo | null>
	clearTables: () => void

	// Scan state actions
	getScanState: (tableName: string) => ScanState
	setScanState: (tableName: string, state: ScanState) => void
	clearScanState: (tableName: string) => void

	// Config sync
	syncFromConfig: () => void
}

const initialTablesState: TablesState = {
	tables: [],
	tableInfoCache: new Map(),
	isLoading: false,
	error: null,
	hasMore: true,
	lastTableName: undefined,
	initialized: false,
}

export const createInitialScanState = (): ScanState => ({
	items: [],
	isLoading: false,
	error: null,
	hasMore: true,
	lastEvaluatedKey: undefined,
	scannedCount: 0,
	filterConditions: [],
	initialized: false,
})

export const useAppStore = create<AppState>((set, get) => ({
	// Initial state
	profile: savedConfig.profile,
	region: savedConfig.region ?? getDefaultRegion(savedConfig.profile),
	pageSize: savedConfig.pageSize ?? DEFAULT_PAGE_SIZE,
	currentView: { view: 'home' },
	history: [],
	tablesState: initialTablesState,
	scanStateCache: new Map(),

	// Actions
	setProfile: (profile) => {
		set({ profile, tablesState: initialTablesState, scanStateCache: new Map() })
		const { region, pageSize } = get()
		saveUserConfig({ profile, region, pageSize })
		get().fetchTables(true)
	},

	setRegion: (region) => {
		set({ region, tablesState: initialTablesState, scanStateCache: new Map() })
		const { profile, pageSize } = get()
		saveUserConfig({ profile, region, pageSize })
		get().fetchTables(true)
	},

	setPageSize: (pageSize) => {
		set({ pageSize })
		const { profile, region } = get()
		saveUserConfig({ profile, region, pageSize })
	},

	navigate: (view, from) =>
		set((state) => ({
			history: [...state.history, from ?? state.currentView],
			currentView: view,
		})),

	goBack: () =>
		set((state) => {
			const previousView = state.history.at(-1)
			if (!previousView) return state
			return {
				history: state.history.slice(0, -1),
				currentView: previousView,
			}
		}),

	canGoBack: () => get().history.length > 0,

	// Tables actions
	fetchTables: async (reset = false) => {
		const { profile, region, tablesState } = get()
		const startTableName = reset ? undefined : tablesState.lastTableName

		set({
			tablesState: {
				...tablesState,
				isLoading: true,
				error: null,
				...(reset ? { tables: [], lastTableName: undefined, hasMore: true } : {}),
			},
		})

		try {
			const result = await listTables({ profile, region }, startTableName)
			const { tablesState: currentState } = get()

			set({
				tablesState: {
					...currentState,
					tables: reset ? result.tables : [...currentState.tables, ...result.tables],
					lastTableName: result.lastTableName,
					hasMore: result.lastTableName !== undefined,
					isLoading: false,
					initialized: true,
				},
			})
		} catch (err) {
			const { tablesState: currentState } = get()
			set({
				tablesState: {
					...currentState,
					error: err instanceof Error ? err.message : 'Failed to fetch tables',
					isLoading: false,
					initialized: true,
				},
			})
		}
	},

	fetchTableInfo: async (tableName: string) => {
		const { profile, region, tablesState } = get()
		const cached = tablesState.tableInfoCache.get(tableName)
		if (cached) return cached

		try {
			const info = await getTableInfo(tableName, { profile, region })
			const { tablesState: currentState } = get()
			const newCache = new Map(currentState.tableInfoCache)
			newCache.set(tableName, info)
			set({
				tablesState: { ...currentState, tableInfoCache: newCache },
			})
			return info
		} catch {
			return null
		}
	},

	clearTables: () => set({ tablesState: initialTablesState }),

	// Scan state actions
	getScanState: (tableName) => {
		const cached = get().scanStateCache.get(tableName)
		return cached ?? createInitialScanState()
	},

	setScanState: (tableName, state) => {
		const newCache = new Map(get().scanStateCache)
		newCache.set(tableName, state)
		set({ scanStateCache: newCache })
	},

	clearScanState: (tableName) => {
		const newCache = new Map(get().scanStateCache)
		newCache.delete(tableName)
		set({ scanStateCache: newCache })
	},

	syncFromConfig: () => {
		const config = loadUserConfig()
		const { profile, region, pageSize } = get()
		const configRegion = config.region ?? getDefaultRegion(config.profile)
		const configPageSize = config.pageSize ?? DEFAULT_PAGE_SIZE

		// Only update if different to avoid unnecessary re-renders
		if (profile !== config.profile || region !== configRegion || pageSize !== configPageSize) {
			set({
				profile: config.profile,
				region: configRegion,
				pageSize: configPageSize,
			})
		}
	},
}))

// Selectors
export const selectConfig = (state: AppState) => ({
	profile: state.profile,
	region: state.region,
	pageSize: state.pageSize,
})

export const selectCurrentView = (state: AppState) => state.currentView
export const selectCanGoBack = (state: AppState) => state.history.length > 0
