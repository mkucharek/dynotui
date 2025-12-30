import { create } from 'zustand'
import type { FilterCondition } from '../schemas/query-params.js'
import { getDefaultRegion } from '../services/aws-config.js'
import { type ParsedDynamoDBError, parseDynamoDBError } from '../services/dynamodb/errors.js'
import { getTableInfo, listTables, type TableInfo } from '../services/dynamodb/index.js'
import { loadUserConfig, saveUserConfig } from '../services/user-config.js'
import type { ConfigDefaults, ConfigSource, ResolvedValue, RuntimeConfig } from '../types/config.js'
import type { ViewState } from '../types/navigation.js'

const savedConfig = loadUserConfig()

export type FocusedPanel = 'connection' | 'browse' | 'main'
export type ConnectionTab = 'profile' | 'region'
export type BrowseTab = 'tables' | 'saved'
export type InputMode = 'sidebar' | 'normal' | 'query-form' | 'scan-filter' | 'item-detail'

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

export type QueryState = {
	items: Record<string, unknown>[]
	isLoading: boolean
	error: ParsedDynamoDBError | null
	hasMore: boolean
	lastEvaluatedKey: Record<string, unknown> | undefined
	scannedCount: number
	queryParams: QueryParamsCache | null
	initialized: boolean
}

export type QueryParamsCache = {
	indexName?: string
	partitionKey: { name: string; value: string | number }
	sortKey?: {
		name: string
		value: string | number
		operator?: 'eq' | 'lt' | 'lte' | 'gt' | 'gte' | 'between' | 'begins_with'
		valueTo?: string | number
	}
	filterConditions?: FilterCondition[]
	limit?: number
	scanIndexForward?: boolean
}

export type TablesState = {
	tables: string[]
	tableInfoCache: Map<string, TableInfo>
	isLoading: boolean
	error: ParsedDynamoDBError | null
	hasMore: boolean
	lastTableName: string | undefined
	initialized: boolean
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
	queryStateCache: Map<string, QueryState>
	focusedPanel: FocusedPanel
	connectionTab: ConnectionTab
	browseTab: BrowseTab
	inputMode: InputMode

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
	getQueryState: (tableName: string) => QueryState
	setQueryState: (tableName: string, state: QueryState) => void
	clearQueryState: (tableName: string) => void
	setFocusedPanel: (panel: FocusedPanel) => void
	setConnectionTab: (tab: ConnectionTab) => void
	setBrowseTab: (tab: BrowseTab) => void
	cycleFocusedPanel: (direction: 'next' | 'prev') => void
	cycleCurrentPanelTab: (direction: 'next' | 'prev') => void
	setInputMode: (mode: InputMode) => void
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

export const createInitialQueryState = (): QueryState => ({
	items: [],
	isLoading: false,
	error: null,
	hasMore: true,
	lastEvaluatedKey: undefined,
	scannedCount: 0,
	queryParams: null,
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
	queryStateCache: new Map(),
	focusedPanel: 'connection',
	connectionTab: 'profile',
	browseTab: 'tables',
	inputMode: 'sidebar',

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
			queryStateCache: new Map(),
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
			queryStateCache: new Map(),
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
			queryStateCache: new Map(),
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
		set((state) => {
			let newInputMode: InputMode = state.inputMode
			let newFocusedPanel: FocusedPanel = state.focusedPanel

			if (view.view === 'table') {
				newFocusedPanel = 'main'
				newInputMode = 'normal'
			} else if (view.view === 'item') {
				newFocusedPanel = 'main'
				newInputMode = 'item-detail'
			} else if (view.view === 'home') {
				newFocusedPanel = 'browse'
				newInputMode = 'sidebar'
			} else if (view.view === 'settings') {
				newFocusedPanel = 'main'
				newInputMode = 'normal'
			}

			return {
				history: [...state.history, from ?? state.currentView],
				currentView: view,
				focusedPanel: newFocusedPanel,
				inputMode: newInputMode,
			}
		}),

	goBack: () =>
		set((state) => {
			const previousView = state.history.at(-1)
			if (!previousView) return state

			let newInputMode: InputMode = state.inputMode
			let newFocusedPanel: FocusedPanel = state.focusedPanel

			if (previousView.view === 'home') {
				newFocusedPanel = 'browse'
				newInputMode = 'sidebar'
			} else if (previousView.view === 'table') {
				newFocusedPanel = 'main'
				newInputMode = 'normal'
			} else if (previousView.view === 'item') {
				newInputMode = 'item-detail'
			} else if (previousView.view === 'settings') {
				newFocusedPanel = 'main'
				newInputMode = 'normal'
			}

			return {
				history: state.history.slice(0, -1),
				currentView: previousView,
				focusedPanel: newFocusedPanel,
				inputMode: newInputMode,
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
					error: parseDynamoDBError(err),
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

	// Query state actions
	getQueryState: (tableName) => {
		const cached = get().queryStateCache.get(tableName)
		return cached ?? createInitialQueryState()
	},

	setQueryState: (tableName, state) => {
		const newCache = new Map(get().queryStateCache)
		newCache.set(tableName, state)
		set({ queryStateCache: newCache })
	},

	clearQueryState: (tableName) => {
		const newCache = new Map(get().queryStateCache)
		newCache.delete(tableName)
		set({ queryStateCache: newCache })
	},

	setFocusedPanel: (panel) =>
		set((state) => {
			const inputMode = panel === 'main' ? 'normal' : 'sidebar'
			// If already on this panel, cycle its tabs
			if (state.focusedPanel === panel) {
				if (panel === 'connection') {
					const newTab = state.connectionTab === 'profile' ? 'region' : 'profile'
					return { connectionTab: newTab }
				}
				if (panel === 'browse') {
					const newTab = state.browseTab === 'tables' ? 'saved' : 'tables'
					return { browseTab: newTab }
				}
				return state
			}
			// Otherwise switch to the panel
			return { focusedPanel: panel, inputMode }
		}),

	setConnectionTab: (tab) => set({ connectionTab: tab }),

	setBrowseTab: (tab) => set({ browseTab: tab }),

	cycleFocusedPanel: (direction) =>
		set((state) => {
			const panels: FocusedPanel[] = ['connection', 'browse', 'main']
			const currentIdx = panels.indexOf(state.focusedPanel)
			const nextIdx =
				direction === 'next'
					? (currentIdx + 1) % panels.length
					: (currentIdx - 1 + panels.length) % panels.length
			const newPanel = panels[nextIdx]
			const newInputMode: InputMode = newPanel === 'main' ? 'normal' : 'sidebar'
			return { focusedPanel: newPanel, inputMode: newInputMode }
		}),

	cycleCurrentPanelTab: (direction) =>
		set((state) => {
			if (state.focusedPanel === 'connection') {
				const tabs: ConnectionTab[] = ['profile', 'region']
				const currentIdx = tabs.indexOf(state.connectionTab)
				const nextIdx =
					direction === 'next'
						? (currentIdx + 1) % tabs.length
						: (currentIdx - 1 + tabs.length) % tabs.length
				return { connectionTab: tabs[nextIdx] }
			}
			if (state.focusedPanel === 'browse') {
				const tabs: BrowseTab[] = ['tables', 'saved']
				const currentIdx = tabs.indexOf(state.browseTab)
				const nextIdx =
					direction === 'next'
						? (currentIdx + 1) % tabs.length
						: (currentIdx - 1 + tabs.length) % tabs.length
				return { browseTab: tabs[nextIdx] }
			}
			return state
		}),

	setInputMode: (mode) => set({ inputMode: mode }),
}))
