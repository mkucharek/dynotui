import { describe, expect, it } from 'vitest'
import { queryParamsSchema, scanParamsSchema, sortKeyOperatorSchema } from './query-params.js'

describe('sortKeyOperatorSchema', () => {
	it('accepts valid operators', () => {
		const operators = ['eq', 'lt', 'lte', 'gt', 'gte', 'between', 'begins_with'] as const
		for (const op of operators) {
			expect(sortKeyOperatorSchema.parse(op)).toBe(op)
		}
	})

	it('rejects invalid operators', () => {
		expect(() => sortKeyOperatorSchema.parse('invalid')).toThrow()
		expect(() => sortKeyOperatorSchema.parse('')).toThrow()
	})
})

describe('queryParamsSchema', () => {
	it('accepts minimal query params', () => {
		const result = queryParamsSchema.parse({
			tableName: 'users',
			partitionKey: { name: 'pk', value: 'user#1' },
		})
		expect(result.tableName).toBe('users')
		expect(result.partitionKey.name).toBe('pk')
	})

	it('accepts full query params', () => {
		const result = queryParamsSchema.parse({
			tableName: 'users',
			partitionKey: { name: 'pk', value: 'user#1' },
			sortKey: { name: 'sk', value: 'profile', operator: 'begins_with' },
			limit: 100,
			scanIndexForward: false,
			indexName: 'gsi1',
		})
		expect(result.sortKey?.operator).toBe('begins_with')
		expect(result.limit).toBe(100)
	})

	it('defaults sort key operator to eq', () => {
		const result = queryParamsSchema.parse({
			tableName: 'users',
			partitionKey: { name: 'pk', value: 'user#1' },
			sortKey: { name: 'sk', value: 'test' },
		})
		expect(result.sortKey?.operator).toBe('eq')
	})

	it('accepts numeric partition key value', () => {
		const result = queryParamsSchema.parse({
			tableName: 'numbers',
			partitionKey: { name: 'id', value: 123 },
		})
		expect(result.partitionKey.value).toBe(123)
	})

	it('accepts between operator with valueTo', () => {
		const result = queryParamsSchema.parse({
			tableName: 'events',
			partitionKey: { name: 'pk', value: 'sensor' },
			sortKey: { name: 'timestamp', value: 1000, operator: 'between', valueTo: 2000 },
		})
		expect(result.sortKey?.valueTo).toBe(2000)
	})

	it('rejects empty table name', () => {
		expect(() =>
			queryParamsSchema.parse({
				tableName: '',
				partitionKey: { name: 'pk', value: 'v' },
			}),
		).toThrow()
	})

	it('rejects limit out of range', () => {
		expect(() =>
			queryParamsSchema.parse({
				tableName: 'test',
				partitionKey: { name: 'pk', value: 'v' },
				limit: 0,
			}),
		).toThrow()

		expect(() =>
			queryParamsSchema.parse({
				tableName: 'test',
				partitionKey: { name: 'pk', value: 'v' },
				limit: 1001,
			}),
		).toThrow()
	})
})

describe('scanParamsSchema', () => {
	it('accepts minimal scan params', () => {
		const result = scanParamsSchema.parse({
			tableName: 'users',
		})
		expect(result.tableName).toBe('users')
	})

	it('accepts full scan params', () => {
		const result = scanParamsSchema.parse({
			tableName: 'users',
			limit: 50,
			filterExpression: '#status = :status',
			expressionAttributeNames: { '#status': 'status' },
			expressionAttributeValues: { ':status': 'active' },
		})
		expect(result.filterExpression).toBe('#status = :status')
	})

	it('rejects empty table name', () => {
		expect(() => scanParamsSchema.parse({ tableName: '' })).toThrow()
	})

	it('rejects invalid limit', () => {
		expect(() => scanParamsSchema.parse({ tableName: 'test', limit: 0 })).toThrow()
		expect(() => scanParamsSchema.parse({ tableName: 'test', limit: 1001 })).toThrow()
	})
})
