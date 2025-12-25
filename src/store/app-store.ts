import { create } from 'zustand'
import { getDefaultRegion } from '../services/aws-config.js'
import type { ViewState } from '../types/navigation.js'

export type AppState = {
	// AWS config
	profile: string | undefined
	region: string

	// Navigation
	currentView: ViewState
	history: ViewState[]

	// Actions
	setProfile: (profile: string | undefined) => void
	setRegion: (region: string) => void
	navigate: (view: ViewState) => void
	goBack: () => void
	canGoBack: () => boolean
}

export const useAppStore = create<AppState>((set, get) => ({
	// Initial state
	profile: undefined,
	region: getDefaultRegion(),
	currentView: { view: 'home' },
	history: [],

	// Actions
	setProfile: (profile) => set({ profile }),

	setRegion: (region) => set({ region }),

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
})

export const selectCurrentView = (state: AppState) => state.currentView
export const selectCanGoBack = (state: AppState) => state.history.length > 0
