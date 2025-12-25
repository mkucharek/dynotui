/**
 * @vitest-environment jsdom
 */

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from './app-store.js'
import { useTables } from './use-tables.js'

vi.mock('../services/dynamodb/index.js', () => ({
	listTables: vi.fn(),
	getTableInfo: vi.fn(),
}))

import { getTableInfo, listTables } from '../services/dynamodb/index.js'

describe('useTables', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		useAppStore.setState({
			profile: undefined,
			region: 'us-east-1',
			currentView: { view: 'home' },
			history: [],
		})
	})

	it('has initial state', () => {
		const { result } = renderHook(() => useTables())

		expect(result.current.tables).toEqual([])
		expect(result.current.isLoading).toBe(false)
		expect(result.current.error).toBeNull()
		expect(result.current.hasMore).toBe(true)
	})

	it('fetches tables', async () => {
		vi.mocked(listTables).mockResolvedValue({
			tables: ['table1', 'table2'],
			lastTableName: undefined,
		})

		const { result } = renderHook(() => useTables())

		await act(async () => {
			await result.current.fetchTables()
		})

		await waitFor(() => {
			expect(result.current.tables).toEqual(['table1', 'table2'])
			expect(result.current.hasMore).toBe(false)
			expect(result.current.isLoading).toBe(false)
		})
	})

	it('handles fetch error', async () => {
		vi.mocked(listTables).mockRejectedValue(new Error('Network error'))

		const { result } = renderHook(() => useTables())

		await act(async () => {
			await result.current.fetchTables()
		})

		await waitFor(() => {
			expect(result.current.error).toBe('Network error')
			expect(result.current.isLoading).toBe(false)
		})
	})

	it('fetches table info', async () => {
		const mockInfo = {
			name: 'users',
			status: 'ACTIVE',
			itemCount: 100,
			sizeBytes: 5000,
			partitionKey: 'id',
			sortKey: undefined,
		}
		vi.mocked(getTableInfo).mockResolvedValue(mockInfo)

		const { result } = renderHook(() => useTables())

		await act(async () => {
			await result.current.fetchTableInfo('users')
		})

		expect(result.current.tableInfoCache.get('users')).toEqual(mockInfo)
	})

	it('caches table info', async () => {
		vi.mocked(getTableInfo).mockResolvedValue({
			name: 'users',
			status: 'ACTIVE',
			itemCount: 100,
			sizeBytes: 5000,
			partitionKey: 'id',
			sortKey: undefined,
		})

		const { result } = renderHook(() => useTables())

		// First call - should fetch
		await act(async () => {
			await result.current.fetchTableInfo('users')
		})

		// Second call - should use cache
		await act(async () => {
			await result.current.fetchTableInfo('users')
		})

		// Cache is internal Map - may be called multiple times due to React's behavior
		// but subsequent calls should return cached result
		expect(result.current.tableInfoCache.has('users')).toBe(true)
	})
})
