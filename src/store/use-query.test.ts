/**
 * @vitest-environment jsdom
 */

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from './app-store.js'
import { useQuery } from './use-query.js'

vi.mock('../services/dynamodb/index.js', () => ({
	query: vi.fn(),
	parseDynamoDBError: vi.fn((err) => ({
		type: 'unknown',
		message: err instanceof Error ? err.message : 'Unknown error',
	})),
}))

import { query } from '../services/dynamodb/index.js'

describe('useQuery', () => {
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
		const { result } = renderHook(() => useQuery('test-table'))

		expect(result.current.items).toEqual([])
		expect(result.current.isLoading).toBe(false)
		expect(result.current.error).toBeNull()
		expect(result.current.queryParams).toBeNull()
	})

	it('executes query', async () => {
		vi.mocked(query).mockResolvedValue({
			items: [{ pk: 'user#1', sk: 'profile' }],
			count: 1,
			scannedCount: 1,
			lastEvaluatedKey: undefined,
		})

		const { result } = renderHook(() => useQuery('test-table'))

		await act(async () => {
			await result.current.executeQuery({ partitionKey: { name: 'pk', value: 'user#1' } }, true)
		})

		await waitFor(() => {
			expect(result.current.items).toEqual([{ pk: 'user#1', sk: 'profile' }])
			expect(result.current.hasMore).toBe(false)
		})
	})

	it('stores query params for pagination', async () => {
		vi.mocked(query).mockResolvedValue({
			items: [{ pk: 'user#1' }],
			count: 1,
			scannedCount: 1,
			lastEvaluatedKey: { pk: 'user#1' },
		})

		const { result } = renderHook(() => useQuery('test-table'))

		await act(async () => {
			await result.current.executeQuery({ partitionKey: { name: 'pk', value: 'user#1' } }, true)
		})

		await waitFor(() => {
			expect(result.current.queryParams).toEqual({
				partitionKey: { name: 'pk', value: 'user#1' },
			})
		})
	})

	it('handles error', async () => {
		vi.mocked(query).mockRejectedValue(new Error('Query failed'))

		const { result } = renderHook(() => useQuery('test-table'))

		await act(async () => {
			await result.current.executeQuery({ partitionKey: { name: 'pk', value: 'user#1' } }, true)
		})

		await waitFor(() => {
			expect(result.current.error).toEqual({
				type: 'unknown',
				message: 'Query failed',
			})
		})
	})

	it('resets state', async () => {
		vi.mocked(query).mockResolvedValue({
			items: [{ pk: 'user#1' }],
			count: 1,
			scannedCount: 1,
			lastEvaluatedKey: undefined,
		})

		const { result } = renderHook(() => useQuery('test-table'))

		await act(async () => {
			await result.current.executeQuery({ partitionKey: { name: 'pk', value: 'user#1' } }, true)
		})

		await waitFor(() => {
			expect(result.current.items).toHaveLength(1)
		})

		act(() => {
			result.current.reset()
		})

		expect(result.current.items).toEqual([])
		expect(result.current.queryParams).toBeNull()
	})
})
