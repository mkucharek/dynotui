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
	})
})
