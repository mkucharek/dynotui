import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PAGE_SIZE, useAppStore } from './app-store.js'

describe('useAppStore', () => {
	beforeEach(() => {
		// Reset store between tests
		useAppStore.setState({
			runtimeProfile: { value: undefined, source: 'default' },
			runtimeRegion: { value: 'us-east-1', source: 'default' },
			profile: undefined,
			region: 'us-east-1',
			pageSize: DEFAULT_PAGE_SIZE,
			configDefaults: {
				profile: undefined,
				region: undefined,
				pageSize: DEFAULT_PAGE_SIZE,
			},
			currentView: { view: 'home' },
			history: [],
		})
	})

	describe('initial state', () => {
		it('has default values', () => {
			const state = useAppStore.getState()
			expect(state.profile).toBeUndefined()
			expect(state.region).toBe('us-east-1')
			expect(state.currentView).toEqual({ view: 'home' })
			expect(state.history).toEqual([])
		})
	})

	describe('setRuntimeProfile', () => {
		it('updates profile', () => {
			useAppStore.getState().setRuntimeProfile('dev', 'default')
			expect(useAppStore.getState().profile).toBe('dev')
			expect(useAppStore.getState().runtimeProfile).toEqual({ value: 'dev', source: 'default' })
		})

		it('clears profile', () => {
			useAppStore.getState().setRuntimeProfile('dev', 'default')
			useAppStore.getState().setRuntimeProfile(undefined, 'default')
			expect(useAppStore.getState().profile).toBeUndefined()
		})
	})

	describe('setRuntimeRegion', () => {
		it('updates region', () => {
			useAppStore.getState().setRuntimeRegion('eu-west-1', 'default')
			expect(useAppStore.getState().region).toBe('eu-west-1')
			expect(useAppStore.getState().runtimeRegion).toEqual({
				value: 'eu-west-1',
				source: 'default',
			})
		})
	})

	describe('setConfigDefault', () => {
		it('updates config profile default', () => {
			useAppStore.getState().setConfigDefault('profile', 'prod')
			expect(useAppStore.getState().configDefaults.profile).toBe('prod')
			// Runtime should not be affected
			expect(useAppStore.getState().profile).toBeUndefined()
		})

		it('updates config region default', () => {
			useAppStore.getState().setConfigDefault('region', 'eu-west-1')
			expect(useAppStore.getState().configDefaults.region).toBe('eu-west-1')
			// Runtime should not be affected
			expect(useAppStore.getState().region).toBe('us-east-1')
		})

		it('updates pageSize in both config and runtime', () => {
			useAppStore.getState().setConfigDefault('pageSize', 100)
			expect(useAppStore.getState().configDefaults.pageSize).toBe(100)
			// pageSize affects runtime too
			expect(useAppStore.getState().pageSize).toBe(100)
		})
	})

	describe('initializeFromResolution', () => {
		it('sets runtime config from resolved values', () => {
			useAppStore.getState().initializeFromResolution({
				profile: { value: 'cli-profile', source: 'cli' },
				region: { value: 'ap-southeast-1', source: 'env' },
			})
			const state = useAppStore.getState()
			expect(state.profile).toBe('cli-profile')
			expect(state.region).toBe('ap-southeast-1')
			expect(state.runtimeProfile).toEqual({ value: 'cli-profile', source: 'cli' })
			expect(state.runtimeRegion).toEqual({ value: 'ap-southeast-1', source: 'env' })
		})
	})

	describe('navigate', () => {
		it('navigates to table view', () => {
			useAppStore.getState().navigate({ view: 'table', tableName: 'users', mode: 'scan' })

			const state = useAppStore.getState()
			expect(state.currentView).toEqual({ view: 'table', tableName: 'users', mode: 'scan' })
			expect(state.history).toHaveLength(1)
			expect(state.history[0]).toEqual({ view: 'home' })
		})

		it('navigates to item view', () => {
			useAppStore.getState().navigate({ view: 'table', tableName: 'users', mode: 'scan' })
			useAppStore.getState().navigate({ view: 'item', tableName: 'users', item: { id: '1' } })

			const state = useAppStore.getState()
			expect(state.currentView).toEqual({ view: 'item', tableName: 'users', item: { id: '1' } })
			expect(state.history).toHaveLength(2)
		})
	})

	describe('goBack', () => {
		it('returns to previous view', () => {
			useAppStore.getState().navigate({ view: 'table', tableName: 'users', mode: 'scan' })
			useAppStore.getState().goBack()

			const state = useAppStore.getState()
			expect(state.currentView).toEqual({ view: 'home' })
			expect(state.history).toHaveLength(0)
		})

		it('does nothing when no history', () => {
			useAppStore.getState().goBack()

			const state = useAppStore.getState()
			expect(state.currentView).toEqual({ view: 'home' })
			expect(state.history).toHaveLength(0)
		})
	})

	describe('canGoBack', () => {
		it('returns false when no history', () => {
			expect(useAppStore.getState().canGoBack()).toBe(false)
		})

		it('returns true when history exists', () => {
			useAppStore.getState().navigate({ view: 'table', tableName: 'users', mode: 'scan' })
			expect(useAppStore.getState().canGoBack()).toBe(true)
		})
	})

	describe('focus management', () => {
		beforeEach(() => {
			useAppStore.setState({
				focusedPanel: 'connection',
				connectionTab: 'profile',
				browseTab: 'tables',
			})
		})

		it('setFocusedPanel changes panel', () => {
			useAppStore.getState().setFocusedPanel('main')
			expect(useAppStore.getState().focusedPanel).toBe('main')
		})

		it('setConnectionTab changes connection tab', () => {
			useAppStore.getState().setConnectionTab('region')
			expect(useAppStore.getState().connectionTab).toBe('region')
		})

		it('setBrowseTab changes browse tab', () => {
			useAppStore.getState().setBrowseTab('saved')
			expect(useAppStore.getState().browseTab).toBe('saved')
		})

		it('cycleFocusedPanel cycles through panels', () => {
			expect(useAppStore.getState().focusedPanel).toBe('connection')
			useAppStore.getState().cycleFocusedPanel('next')
			expect(useAppStore.getState().focusedPanel).toBe('browse')
			useAppStore.getState().cycleFocusedPanel('next')
			expect(useAppStore.getState().focusedPanel).toBe('main')
			useAppStore.getState().cycleFocusedPanel('next')
			expect(useAppStore.getState().focusedPanel).toBe('connection')
		})

		it('goBack restores browse focus when returning to home', () => {
			useAppStore.getState().navigate({ view: 'table', tableName: 'users', mode: 'scan' })
			useAppStore.getState().setFocusedPanel('main')
			useAppStore.getState().goBack()
			expect(useAppStore.getState().focusedPanel).toBe('browse')
		})
	})
})
