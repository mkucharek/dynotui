import { create } from 'zustand'
import { getDefaultRegion } from '../services/aws-config.js'
import { loadUserConfig, saveUserConfig } from '../services/user-config.js'
import type { ViewState } from '../types/navigation.js'

const savedConfig = loadUserConfig()

export const DEFAULT_PAGE_SIZE = 25

export type AppState = {
	// AWS config
	profile: string | undefined
	region: string
	pageSize: number

	// Navigation
	currentView: ViewState
	history: ViewState[]

	// Actions
	setProfile: (profile: string | undefined) => void
	setRegion: (region: string) => void
	setPageSize: (pageSize: number) => void
	navigate: (view: ViewState) => void
	goBack: () => void
	canGoBack: () => boolean
}

export const useAppStore = create<AppState>((set, get) => ({
	// Initial state
	profile: savedConfig.profile,
	region: savedConfig.region ?? getDefaultRegion(savedConfig.profile),
	pageSize: savedConfig.pageSize ?? DEFAULT_PAGE_SIZE,
	currentView: { view: 'home' },
	history: [],

	// Actions
	setProfile: (profile) => {
		set({ profile })
		const { region, pageSize } = get()
		saveUserConfig({ profile, region, pageSize })
	},

	setRegion: (region) => {
		set({ region })
		const { profile, pageSize } = get()
		saveUserConfig({ profile, region, pageSize })
	},

	setPageSize: (pageSize) => {
		set({ pageSize })
		const { profile, region } = get()
		saveUserConfig({ profile, region, pageSize })
	},

	navigate: (view) =>
		set((state) => ({
			history: [...state.history, state.currentView],
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
}))

// Selectors
export const selectConfig = (state: AppState) => ({
	profile: state.profile,
	region: state.region,
	pageSize: state.pageSize,
})

export const selectCurrentView = (state: AppState) => state.currentView
export const selectCanGoBack = (state: AppState) => state.history.length > 0
