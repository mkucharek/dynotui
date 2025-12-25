/**
 * @vitest-environment jsdom
 */

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from './app-store.js'
import { useScan } from './use-scan.js'

vi.mock('../services/dynamodb/index.js', () => ({
	scan: vi.fn(),
}))

import { scan } from '../services/dynamodb/index.js'

describe('useScan', () => {
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
		const { result } = renderHook(() => useScan('test-table'))

		expect(result.current.items).toEqual([])
		expect(result.current.isLoading).toBe(false)
		expect(result.current.error).toBeNull()
		expect(result.current.hasMore).toBe(true)
	})

	it('executes scan', async () => {
		vi.mocked(scan).mockResolvedValue({
			items: [{ id: '1' }, { id: '2' }],
			count: 2,
			scannedCount: 2,
			lastEvaluatedKey: undefined,
		})

		const { result } = renderHook(() => useScan('test-table'))

		await act(async () => {
			await result.current.executeScan({}, true)
		})

		await waitFor(() => {
			expect(result.current.items).toEqual([{ id: '1' }, { id: '2' }])
			expect(result.current.hasMore).toBe(false)
		})
	})

	it('handles pagination', async () => {
		vi.mocked(scan)
			.mockResolvedValueOnce({
				items: [{ id: '1' }],
				count: 1,
				scannedCount: 1,
				lastEvaluatedKey: { id: '1' },
			})
			.mockResolvedValueOnce({
				items: [{ id: '2' }],
				count: 1,
				scannedCount: 1,
				lastEvaluatedKey: undefined,
			})

		const { result } = renderHook(() => useScan('test-table'))

		await act(async () => {
			await result.current.executeScan({}, true)
		})

		await waitFor(() => {
			expect(result.current.items).toHaveLength(1)
			expect(result.current.hasMore).toBe(true)
		})

		await act(async () => {
			await result.current.fetchNextPage()
		})

		await waitFor(() => {
			expect(result.current.items).toHaveLength(2)
			expect(result.current.hasMore).toBe(false)
		})
	})

	it('handles error', async () => {
		vi.mocked(scan).mockRejectedValue(new Error('Scan failed'))

		const { result } = renderHook(() => useScan('test-table'))

		await act(async () => {
			await result.current.executeScan({}, true)
		})

		await waitFor(() => {
			expect(result.current.error).toBe('Scan failed')
		})
	})

	it('resets state', async () => {
		vi.mocked(scan).mockResolvedValue({
			items: [{ id: '1' }],
			count: 1,
			scannedCount: 1,
			lastEvaluatedKey: undefined,
		})

		const { result } = renderHook(() => useScan('test-table'))

		await act(async () => {
			await result.current.executeScan({}, true)
		})

		await waitFor(() => {
			expect(result.current.items).toHaveLength(1)
		})

		act(() => {
			result.current.reset()
		})

		expect(result.current.items).toEqual([])
		expect(result.current.hasMore).toBe(true)
	})
})
