import { beforeEach, describe, expect, it, vi } from 'vitest'
import { describeTable, getTableInfo, listTables } from './tables.js'

vi.mock('./client.js', () => ({
	createClient: vi.fn(() => ({
		send: vi.fn(),
	})),
}))

import { createClient } from './client.js'

describe('listTables', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns table names', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			TableNames: ['table1', 'table2'],
			LastEvaluatedTableName: undefined,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await listTables()

		expect(result.tables).toEqual(['table1', 'table2'])
		expect(result.lastTableName).toBeUndefined()
	})

	it('handles pagination', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			TableNames: ['table3'],
			LastEvaluatedTableName: 'table3',
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await listTables({}, 'table2')

		expect(result.tables).toEqual(['table3'])
		expect(result.lastTableName).toBe('table3')
	})

	it('handles empty result', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			TableNames: undefined,
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await listTables()

		expect(result.tables).toEqual([])
	})
})

describe('describeTable', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns table description', async () => {
		const mockTable = {
			TableName: 'test-table',
			TableStatus: 'ACTIVE',
			ItemCount: 100,
		}
		const mockSend = vi.fn().mockResolvedValue({ Table: mockTable })
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await describeTable('test-table')

		expect(result).toEqual(mockTable)
	})

	it('throws when table not found', async () => {
		const mockSend = vi.fn().mockResolvedValue({ Table: undefined })
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		await expect(describeTable('missing')).rejects.toThrow('Table missing not found')
	})
})

describe('getTableInfo', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns formatted table info', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Table: {
				TableName: 'users',
				TableStatus: 'ACTIVE',
				ItemCount: 1000,
				TableSizeBytes: 50000,
				KeySchema: [
					{ AttributeName: 'pk', KeyType: 'HASH' },
					{ AttributeName: 'sk', KeyType: 'RANGE' },
				],
			},
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await getTableInfo('users')

		expect(result).toEqual({
			name: 'users',
			status: 'ACTIVE',
			itemCount: 1000,
			sizeBytes: 50000,
			partitionKey: 'pk',
			sortKey: 'sk',
			indexes: [],
		})
	})

	it('handles table without sort key', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Table: {
				TableName: 'simple',
				TableStatus: 'ACTIVE',
				ItemCount: 10,
				TableSizeBytes: 500,
				KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
			},
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await getTableInfo('simple')

		expect(result.partitionKey).toBe('id')
		expect(result.sortKey).toBeUndefined()
		expect(result.indexes).toEqual([])
	})

	it('extracts GSI metadata correctly', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Table: {
				TableName: 'orders',
				TableStatus: 'ACTIVE',
				ItemCount: 100,
				TableSizeBytes: 5000,
				KeySchema: [
					{ AttributeName: 'order_id', KeyType: 'HASH' },
					{ AttributeName: 'item_id', KeyType: 'RANGE' },
				],
				GlobalSecondaryIndexes: [
					{
						IndexName: 'customer-orders-index',
						KeySchema: [
							{ AttributeName: 'customer_id', KeyType: 'HASH' },
							{ AttributeName: 'order_date', KeyType: 'RANGE' },
						],
						Projection: { ProjectionType: 'ALL' },
						IndexStatus: 'ACTIVE',
						ItemCount: 50,
					},
				],
			},
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await getTableInfo('orders')

		expect(result.indexes).toHaveLength(1)
		expect(result.indexes[0]).toEqual({
			name: 'customer-orders-index',
			type: 'GSI',
			partitionKey: 'customer_id',
			sortKey: 'order_date',
			projection: 'ALL',
			status: 'ACTIVE',
		})
	})

	it('extracts LSI metadata correctly', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Table: {
				TableName: 'products',
				TableStatus: 'ACTIVE',
				ItemCount: 100,
				TableSizeBytes: 5000,
				KeySchema: [
					{ AttributeName: 'product_id', KeyType: 'HASH' },
					{ AttributeName: 'variant_id', KeyType: 'RANGE' },
				],
				LocalSecondaryIndexes: [
					{
						IndexName: 'price-index',
						KeySchema: [
							{ AttributeName: 'product_id', KeyType: 'HASH' },
							{ AttributeName: 'price', KeyType: 'RANGE' },
						],
						Projection: { ProjectionType: 'ALL' },
						ItemCount: 100,
					},
				],
			},
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await getTableInfo('products')

		expect(result.indexes).toHaveLength(1)
		expect(result.indexes[0]).toEqual({
			name: 'price-index',
			type: 'LSI',
			partitionKey: 'product_id',
			sortKey: 'price',
			projection: 'ALL',
			status: undefined,
		})
	})

	it('excludes non-ACTIVE GSIs', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Table: {
				TableName: 'test',
				TableStatus: 'ACTIVE',
				ItemCount: 100,
				TableSizeBytes: 5000,
				KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
				GlobalSecondaryIndexes: [
					{
						IndexName: 'active-index',
						KeySchema: [{ AttributeName: 'attr1', KeyType: 'HASH' }],
						Projection: { ProjectionType: 'ALL' },
						IndexStatus: 'ACTIVE',
					},
					{
						IndexName: 'creating-index',
						KeySchema: [{ AttributeName: 'attr2', KeyType: 'HASH' }],
						Projection: { ProjectionType: 'KEYS_ONLY' },
						IndexStatus: 'CREATING',
					},
				],
			},
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await getTableInfo('test')

		expect(result.indexes).toHaveLength(1)
		expect(result.indexes[0]?.name).toBe('active-index')
	})

	it('combines GSI and LSI in correct order', async () => {
		const mockSend = vi.fn().mockResolvedValue({
			Table: {
				TableName: 'combined',
				TableStatus: 'ACTIVE',
				ItemCount: 100,
				TableSizeBytes: 5000,
				KeySchema: [
					{ AttributeName: 'pk', KeyType: 'HASH' },
					{ AttributeName: 'sk', KeyType: 'RANGE' },
				],
				GlobalSecondaryIndexes: [
					{
						IndexName: 'gsi-1',
						KeySchema: [{ AttributeName: 'attr1', KeyType: 'HASH' }],
						Projection: { ProjectionType: 'ALL' },
						IndexStatus: 'ACTIVE',
					},
				],
				LocalSecondaryIndexes: [
					{
						IndexName: 'lsi-1',
						KeySchema: [
							{ AttributeName: 'pk', KeyType: 'HASH' },
							{ AttributeName: 'attr2', KeyType: 'RANGE' },
						],
						Projection: { ProjectionType: 'KEYS_ONLY' },
					},
				],
			},
		})
		vi.mocked(createClient).mockReturnValue({ send: mockSend } as never)

		const result = await getTableInfo('combined')

		expect(result.indexes).toHaveLength(2)
		expect(result.indexes[0]?.type).toBe('GSI')
		expect(result.indexes[1]?.type).toBe('LSI')
	})
})
