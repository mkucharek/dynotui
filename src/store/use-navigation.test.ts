/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from './app-store.js'
import { useNavigation } from './use-navigation.js'

describe('useNavigation', () => {
	beforeEach(() => {
		useAppStore.setState({
			profile: undefined,
			region: 'us-east-1',
			currentView: { view: 'home' },
			history: [],
		})
	})

	it('returns current view', () => {
		const { result } = renderHook(() => useNavigation())
		expect(result.current.currentView).toEqual({ view: 'home' })
	})

	it('navigates to home', () => {
		useAppStore.setState({
			currentView: { view: 'table', tableName: 'users', mode: 'scan' },
			history: [{ view: 'home' }],
		})

		const { result } = renderHook(() => useNavigation())

		act(() => {
			result.current.navigateToHome()
		})

		expect(result.current.currentView).toEqual({ view: 'home' })
	})

	it('navigates to table with scan mode', () => {
		const { result } = renderHook(() => useNavigation())

		act(() => {
			result.current.navigateToTable('users')
		})

		expect(result.current.currentView).toEqual({
			view: 'table',
			tableName: 'users',
			mode: 'scan',
		})
	})

	it('navigates to table with query mode', () => {
		const { result } = renderHook(() => useNavigation())

		act(() => {
			result.current.navigateToTable('users', 'query')
		})

		expect(result.current.currentView).toEqual({
			view: 'table',
			tableName: 'users',
			mode: 'query',
		})
	})

	it('navigates to item', () => {
		const { result } = renderHook(() => useNavigation())
		const item = { id: '1', name: 'Test' }

		act(() => {
			result.current.navigateToItem('users', item)
		})

		expect(result.current.currentView).toEqual({
			view: 'item',
			tableName: 'users',
			item,
		})
	})

	it('switches mode in table view', () => {
		useAppStore.setState({
			currentView: { view: 'table', tableName: 'users', mode: 'scan' },
			history: [{ view: 'home' }],
		})

		const { result } = renderHook(() => useNavigation())

		act(() => {
			result.current.switchMode('query')
		})

		expect(result.current.currentView).toEqual({
			view: 'table',
			tableName: 'users',
			mode: 'query',
		})
	})

	it('canGoBack returns false when no history', () => {
		const { result } = renderHook(() => useNavigation())
		expect(result.current.canGoBack).toBe(false)
	})

	it('canGoBack returns true when history exists', () => {
		const { result } = renderHook(() => useNavigation())

		act(() => {
			result.current.navigateToTable('users')
		})

		expect(result.current.canGoBack).toBe(true)
	})

	it('goBack navigates to previous view', () => {
		const { result } = renderHook(() => useNavigation())

		act(() => {
			result.current.navigateToTable('users')
		})

		act(() => {
			result.current.goBack()
		})

		expect(result.current.currentView).toEqual({ view: 'home' })
	})
})
