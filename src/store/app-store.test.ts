import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from './app-store.js'

describe('useAppStore', () => {
	beforeEach(() => {
		// Reset store between tests
		useAppStore.setState({
			profile: undefined,
			region: 'us-east-1',
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

	describe('setProfile', () => {
		it('updates profile', () => {
			useAppStore.getState().setProfile('dev')
			expect(useAppStore.getState().profile).toBe('dev')
		})

		it('clears profile', () => {
			useAppStore.getState().setProfile('dev')
			useAppStore.getState().setProfile(undefined)
			expect(useAppStore.getState().profile).toBeUndefined()
		})
	})

	describe('setRegion', () => {
		it('updates region', () => {
			useAppStore.getState().setRegion('eu-west-1')
			expect(useAppStore.getState().region).toBe('eu-west-1')
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
})
