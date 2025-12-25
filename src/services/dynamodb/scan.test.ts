import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPaginatedScan, fetchNextPage, scan } from './scan.js'

vi.mock('./client.js', () => ({
	createClient: vi.fn(() => ({
		send: vi.fn(),
	})),
}))

import { createClient } from './client.js'

describe('scan', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns scan results', async () => {
		const mockItems = [{ id: '1' }, { id: '2' }]
		const mockSend = vi.fn().mockResolvedValue({
			Items: mockItems,
			Count: 2,
			ScannedCount: 2,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await scan({ tableName: 'test' })

		expect(result.items).toEqual(mockItems)
		expect(result.count).toBe(2)
		expect(result.lastEvaluatedKey).toBeUndefined()
	})

	it('handles pagination', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ id: '3' }],
			Count: 1,
			ScannedCount: 1,
			LastEvaluatedKey: { id: '3' },
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await scan({
			tableName: 'test',
			limit: 1,
		})

		expect(result.items).toHaveLength(1)
		expect(result.lastEvaluatedKey).toEqual({ id: '3' })
	})

	it('handles empty results', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: undefined,
			Count: 0,
			ScannedCount: 0,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await scan({ tableName: 'empty' })

		expect(result.items).toEqual([])
		expect(result.count).toBe(0)
	})
})

describe('createPaginatedScan', () => {
	it('creates initial state', () => {
		const state = createPaginatedScan({ tableName: 'test' })

		expect(state.params.tableName).toBe('test')
		expect(state.hasMore).toBe(true)
		expect(state.lastEvaluatedKey).toBeUndefined()
	})
})

describe('fetchNextPage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('fetches next page and updates state', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ id: '1' }],
			Count: 1,
			ScannedCount: 1,
			LastEvaluatedKey: { id: '1' },
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const initialState = createPaginatedScan({ tableName: 'test' })
		const { result, nextState } = await fetchNextPage(initialState)

		expect(result.items).toHaveLength(1)
		expect(nextState.hasMore).toBe(true)
		expect(nextState.lastEvaluatedKey).toEqual({ id: '1' })
	})

	it('sets hasMore to false when no more pages', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ id: '2' }],
			Count: 1,
			ScannedCount: 1,
			LastEvaluatedKey: undefined,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const state = createPaginatedScan({ tableName: 'test' })
		const { nextState } = await fetchNextPage(state)

		expect(nextState.hasMore).toBe(false)
	})
})
