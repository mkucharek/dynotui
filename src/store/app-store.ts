import { create } from 'zustand'
import type { FilterCondition } from '../schemas/query-params.js'
import { getDefaultRegion } from '../services/aws-config.js'
import type { ParsedDynamoDBError } from '../services/dynamodb/errors.js'
import { getTableInfo, listTables, type TableInfo } from '../services/dynamodb/index.js'
import { loadUserConfig, saveUserConfig } from '../services/user-config.js'
import type { ConfigSource, ResolvedValue, RuntimeConfig } from '../types/config.js'
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

export type ConfigDefaults = {
	profile?: string
	region?: string
	pageSize: number
}

export type AppState = {
	runtimeProfile: ResolvedValue<string | undefined>
	runtimeRegion: ResolvedValue<string>
	profile: string | undefined
	region: string
	pageSize: number
	configDefaults: ConfigDefaults
	currentView: ViewState
	history: ViewState[]
	tablesState: TablesState
	scanStateCache: Map<string, ScanState>

	setRuntimeProfile: (profile: string | undefined, source: ConfigSource) => void
	setRuntimeRegion: (region: string, source: ConfigSource) => void
	setRuntimeProfileAndRegion: (
		profile: string | undefined,
		region: string,
		regionSource: ConfigSource,
	) => void
	setConfigDefault: (
		key: 'profile' | 'region' | 'pageSize',
		value: string | number | undefined,
	) => void
	initializeFromResolution: (config: RuntimeConfig) => void
	navigate: (view: ViewState, from?: ViewState) => void
	goBack: () => void
	canGoBack: () => boolean
	fetchTables: (reset?: boolean) => Promise<void>
	fetchTableInfo: (tableName: string) => Promise<TableInfo | null>
	clearTables: () => void
	getScanState: (tableName: string) => ScanState
	setScanState: (tableName: string, state: ScanState) => void
	clearScanState: (tableName: string) => void
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
	runtimeProfile: { value: savedConfig.profile, source: 'config' },
	runtimeRegion: {
		value: savedConfig.region ?? getDefaultRegion(savedConfig.profile),
		source: savedConfig.region ? 'config' : 'default',
	},
	profile: savedConfig.profile,
	region: savedConfig.region ?? getDefaultRegion(savedConfig.profile),
	pageSize: savedConfig.pageSize ?? DEFAULT_PAGE_SIZE,
	configDefaults: {
		profile: savedConfig.profile,
		region: savedConfig.region,
		pageSize: savedConfig.pageSize ?? DEFAULT_PAGE_SIZE,
	},
	currentView: { view: 'home' },
	history: [],
	tablesState: initialTablesState,
	scanStateCache: new Map(),

	initializeFromResolution: (config) => {
		set({
			runtimeProfile: config.profile,
			runtimeRegion: config.region,
			profile: config.profile.value,
			region: config.region.value,
		})
	},

	setRuntimeProfile: (profile, source) => {
		const newRuntimeProfile: ResolvedValue<string | undefined> = { value: profile, source }
		const newRegion = getDefaultRegion(profile)
		const newRuntimeRegion: ResolvedValue<string> = { value: newRegion, source: 'default' }

		set({
			runtimeProfile: newRuntimeProfile,
			runtimeRegion: newRuntimeRegion,
			profile,
			region: newRegion,
			tablesState: initialTablesState,
			scanStateCache: new Map(),
		})
		get().fetchTables(true)
	},

	setRuntimeRegion: (region, source) => {
		const newRuntimeRegion: ResolvedValue<string> = { value: region, source }
		set({
			runtimeRegion: newRuntimeRegion,
			region,
			tablesState: initialTablesState,
			scanStateCache: new Map(),
		})
		get().fetchTables(true)
	},

	setRuntimeProfileAndRegion: (profile, region, regionSource) => {
		const newRuntimeProfile: ResolvedValue<string | undefined> = {
			value: profile,
			source: 'default',
		}
		const newRuntimeRegion: ResolvedValue<string> = { value: region, source: regionSource }

		set({
			runtimeProfile: newRuntimeProfile,
			runtimeRegion: newRuntimeRegion,
			profile,
			region,
			tablesState: initialTablesState,
			scanStateCache: new Map(),
		})
		get().fetchTables(true)
	},

	setConfigDefault: (key, value) => {
		const { configDefaults } = get()
		let newDefaults: ConfigDefaults

		if (key === 'pageSize' && typeof value === 'number') {
			newDefaults = { ...configDefaults, pageSize: value }
			set({ configDefaults: newDefaults, pageSize: value })
		} else if (key === 'profile') {
			newDefaults = {
				...configDefaults,
				profile: typeof value === 'string' ? value : undefined,
			}
			set({ configDefaults: newDefaults })
		} else if (key === 'region') {
			newDefaults = {
				...configDefaults,
				region: typeof value === 'string' ? value : undefined,
			}
			set({ configDefaults: newDefaults })
		} else {
			return
		}

		saveUserConfig({
			profile: newDefaults.profile,
			region: newDefaults.region,
			pageSize: newDefaults.pageSize,
		})
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
}))

// Selectors
export const selectConfig = (state: AppState) => ({
	profile: state.profile,
	region: state.region,
	pageSize: state.pageSize,
})

export const selectRuntimeConfig = (state: AppState) => ({
	runtimeProfile: state.runtimeProfile,
	runtimeRegion: state.runtimeRegion,
})

export const selectConfigDefaults = (state: AppState) => state.configDefaults

export const selectCurrentView = (state: AppState) => state.currentView
export const selectCanGoBack = (state: AppState) => state.history.length > 0
