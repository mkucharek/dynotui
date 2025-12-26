import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPaginatedQuery, fetchNextQueryPage, query } from './query.js'

vi.mock('./client.js', () => ({
	createClient: vi.fn(() => ({
		send: vi.fn(),
	})),
}))

import { createClient } from './client.js'

describe('query', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('queries by partition key only', async () => {
		const mockItems = [{ pk: 'user#1', sk: 'profile' }]
		const mockSend = vi.fn().mockResolvedValue({
			Items: mockItems,
			Count: 1,
			ScannedCount: 1,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await query({
			tableName: 'test',
			partitionKey: { name: 'pk', value: 'user#1' },
		})

		expect(result.items).toEqual(mockItems)
		expect(result.count).toBe(1)
	})

	it('queries with sort key equals', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ pk: 'user#1', sk: 'profile' }],
			Count: 1,
			ScannedCount: 1,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await query({
			tableName: 'test',
			partitionKey: { name: 'pk', value: 'user#1' },
			sortKey: { name: 'sk', value: 'profile', operator: 'eq' },
		})

		expect(result.items).toHaveLength(1)
	})

	it('queries with sort key begins_with', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [
				{ pk: 'user#1', sk: 'order#001' },
				{ pk: 'user#1', sk: 'order#002' },
			],
			Count: 2,
			ScannedCount: 2,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await query({
			tableName: 'test',
			partitionKey: { name: 'pk', value: 'user#1' },
			sortKey: { name: 'sk', value: 'order#', operator: 'begins_with' },
		})

		expect(result.items).toHaveLength(2)
	})

	it('queries with sort key between', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ pk: 'sensor', sk: 1000 }],
			Count: 1,
			ScannedCount: 1,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await query({
			tableName: 'test',
			partitionKey: { name: 'pk', value: 'sensor' },
			sortKey: { name: 'sk', value: 500, operator: 'between', valueTo: 1500 },
		})

		expect(result.items).toHaveLength(1)
	})

	it('queries with sort key lt', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ pk: 'a', sk: 1 }],
			Count: 1,
			ScannedCount: 1,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await query({
			tableName: 'test',
			partitionKey: { name: 'pk', value: 'a' },
			sortKey: { name: 'sk', value: 10, operator: 'lt' },
		})

		expect(result.items).toHaveLength(1)
	})

	it('queries with sort key lte', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ pk: 'a', sk: 5 }],
			Count: 1,
			ScannedCount: 1,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await query({
			tableName: 'test',
			partitionKey: { name: 'pk', value: 'a' },
			sortKey: { name: 'sk', value: 5, operator: 'lte' },
		})

		expect(result.items).toHaveLength(1)
	})

	it('queries with sort key gt', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ pk: 'a', sk: 20 }],
			Count: 1,
			ScannedCount: 1,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await query({
			tableName: 'test',
			partitionKey: { name: 'pk', value: 'a' },
			sortKey: { name: 'sk', value: 10, operator: 'gt' },
		})

		expect(result.items).toHaveLength(1)
	})

	it('queries with sort key gte', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ pk: 'a', sk: 10 }],
			Count: 1,
			ScannedCount: 1,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await query({
			tableName: 'test',
			partitionKey: { name: 'pk', value: 'a' },
			sortKey: { name: 'sk', value: 10, operator: 'gte' },
		})

		expect(result.items).toHaveLength(1)
	})

	it('handles pagination', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ pk: 'user#1', sk: 'item#1' }],
			Count: 1,
			ScannedCount: 1,
			LastEvaluatedKey: { pk: 'user#1', sk: 'item#1' },
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await query({
			tableName: 'test',
			partitionKey: { name: 'pk', value: 'user#1' },
			limit: 1,
		})

		expect(result.lastEvaluatedKey).toEqual({ pk: 'user#1', sk: 'item#1' })
	})

	it('queries with GSI', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ gsi_pk: 'status#active' }],
			Count: 1,
			ScannedCount: 1,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await query({
			tableName: 'test',
			partitionKey: { name: 'gsi_pk', value: 'status#active' },
			indexName: 'status-index',
		})

		expect(result.items).toHaveLength(1)
	})

	it('queries with filter condition eq', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ pk: 'user#1', status: 'active' }],
			Count: 1,
			ScannedCount: 5,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await query({
			tableName: 'test',
			partitionKey: { name: 'pk', value: 'user#1' },
			filterConditions: [{ attribute: 'status', operator: 'eq', value: 'active' }],
		})

		expect(result.items).toHaveLength(1)
		expect(result.scannedCount).toBe(5)
		// Verify FilterExpression was passed
		expect(mockSend).toHaveBeenCalledWith(
			expect.objectContaining({
				input: expect.objectContaining({
					FilterExpression: '#f0 = :f0',
				}),
			}),
		)
	})

	it('queries with multiple filter conditions', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ pk: 'order#1', status: 'shipped', total: 150 }],
			Count: 1,
			ScannedCount: 10,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await query({
			tableName: 'orders',
			partitionKey: { name: 'pk', value: 'order#1' },
			filterConditions: [
				{ attribute: 'status', operator: 'eq', value: 'shipped' },
				{ attribute: 'total', operator: 'gt', value: 100 },
			],
		})

		expect(result.items).toHaveLength(1)
		expect(mockSend).toHaveBeenCalledWith(
			expect.objectContaining({
				input: expect.objectContaining({
					FilterExpression: '#f0 = :f0 AND #f1 > :f1',
				}),
			}),
		)
	})

	it('queries with filter condition between', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ pk: 'product#1', price: 50 }],
			Count: 1,
			ScannedCount: 3,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		await query({
			tableName: 'products',
			partitionKey: { name: 'pk', value: 'product#1' },
			filterConditions: [{ attribute: 'price', operator: 'between', value: 20, value2: 100 }],
		})

		expect(mockSend).toHaveBeenCalledWith(
			expect.objectContaining({
				input: expect.objectContaining({
					FilterExpression: '#f0 BETWEEN :f0 AND :f0b',
				}),
			}),
		)
	})

	it('queries with filter condition contains', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ pk: 'doc#1', tags: ['typescript', 'nodejs'] }],
			Count: 1,
			ScannedCount: 2,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		await query({
			tableName: 'docs',
			partitionKey: { name: 'pk', value: 'doc#1' },
			filterConditions: [{ attribute: 'tags', operator: 'contains', value: 'typescript' }],
		})

		expect(mockSend).toHaveBeenCalledWith(
			expect.objectContaining({
				input: expect.objectContaining({
					FilterExpression: 'contains(#f0, :f0)',
				}),
			}),
		)
	})

	it('queries with filter condition attribute_exists', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ pk: 'user#1', email: 'test@example.com' }],
			Count: 1,
			ScannedCount: 3,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		await query({
			tableName: 'users',
			partitionKey: { name: 'pk', value: 'user#1' },
			filterConditions: [{ attribute: 'email', operator: 'attribute_exists' }],
		})

		expect(mockSend).toHaveBeenCalledWith(
			expect.objectContaining({
				input: expect.objectContaining({
					FilterExpression: 'attribute_exists(#f0)',
				}),
			}),
		)
	})

	it('queries with filter condition ne', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ pk: 'item#1', status: 'pending' }],
			Count: 1,
			ScannedCount: 2,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		await query({
			tableName: 'items',
			partitionKey: { name: 'pk', value: 'item#1' },
			filterConditions: [{ attribute: 'status', operator: 'ne', value: 'deleted' }],
		})

		expect(mockSend).toHaveBeenCalledWith(
			expect.objectContaining({
				input: expect.objectContaining({
					FilterExpression: '#f0 <> :f0',
				}),
			}),
		)
	})
})

describe('createPaginatedQuery', () => {
	it('creates initial state', () => {
		const state = createPaginatedQuery({
			tableName: 'test',
			partitionKey: { name: 'pk', value: 'val' },
		})

		expect(state.params.tableName).toBe('test')
		expect(state.hasMore).toBe(true)
	})
})

describe('fetchNextQueryPage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('fetches next page and updates state', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Items: [{ pk: 'user', sk: '1' }],
			Count: 1,
			ScannedCount: 1,
			LastEvaluatedKey: { pk: 'user', sk: '1' },
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const state = createPaginatedQuery({
			tableName: 'test',
			partitionKey: { name: 'pk', value: 'user' },
		})
		const { result, nextState } = await fetchNextQueryPage(state)

		expect(result.items).toHaveLength(1)
		expect(nextState.hasMore).toBe(true)
		expect(nextState.lastEvaluatedKey).toEqual({ pk: 'user', sk: '1' })
	})
})
