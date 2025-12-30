import { describe, expect, it } from 'vitest'
import {
	filterConditionSchema,
	filterOperatorSchema,
	queryParamsSchema,
	scanParamsSchema,
	sortKeyOperatorSchema,
} from './query-params.js'

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

describe('filterOperatorSchema', () => {
	it('accepts all valid filter operators', () => {
		const operators = [
			'eq',
			'ne',
			'lt',
			'lte',
			'gt',
			'gte',
			'between',
			'begins_with',
			'contains',
			'attribute_exists',
			'attribute_not_exists',
		] as const
		for (const op of operators) {
			expect(filterOperatorSchema.parse(op)).toBe(op)
		}
	})

	it('rejects invalid operators', () => {
		expect(() => filterOperatorSchema.parse('invalid')).toThrow()
		expect(() => filterOperatorSchema.parse('like')).toThrow()
	})
})

describe('filterConditionSchema', () => {
	it('accepts basic filter condition', () => {
		const result = filterConditionSchema.parse({
			attribute: 'status',
			operator: 'eq',
			value: 'active',
		})
		expect(result.attribute).toBe('status')
		expect(result.operator).toBe('eq')
		expect(result.value).toBe('active')
	})

	it('accepts numeric values', () => {
		const result = filterConditionSchema.parse({
			attribute: 'price',
			operator: 'gt',
			value: 100,
		})
		expect(result.value).toBe(100)
	})

	it('accepts boolean values', () => {
		const result = filterConditionSchema.parse({
			attribute: 'isActive',
			operator: 'eq',
			value: true,
		})
		expect(result.value).toBe(true)
	})

	it('accepts between operator with value2', () => {
		const result = filterConditionSchema.parse({
			attribute: 'timestamp',
			operator: 'between',
			value: 1000,
			value2: 2000,
		})
		expect(result.value).toBe(1000)
		expect(result.value2).toBe(2000)
	})

	it('accepts attribute_exists without value', () => {
		const result = filterConditionSchema.parse({
			attribute: 'optionalField',
			operator: 'attribute_exists',
		})
		expect(result.attribute).toBe('optionalField')
		expect(result.value).toBeUndefined()
	})

	it('rejects empty attribute name', () => {
		expect(() =>
			filterConditionSchema.parse({
				attribute: '',
				operator: 'eq',
				value: 'test',
			}),
		).toThrow()
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

	it('accepts filter conditions', () => {
		const result = queryParamsSchema.parse({
			tableName: 'orders',
			partitionKey: { name: 'pk', value: 'order#1' },
			filterConditions: [
				{ attribute: 'status', operator: 'eq', value: 'shipped' },
				{ attribute: 'total', operator: 'gt', value: 100 },
			],
		})
		expect(result.filterConditions).toHaveLength(2)
		expect(result.filterConditions?.[0]?.attribute).toBe('status')
		expect(result.filterConditions?.[1]?.operator).toBe('gt')
	})

	it('accepts empty filter conditions array', () => {
		const result = queryParamsSchema.parse({
			tableName: 'test',
			partitionKey: { name: 'pk', value: 'v' },
			filterConditions: [],
		})
		expect(result.filterConditions).toEqual([])
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
