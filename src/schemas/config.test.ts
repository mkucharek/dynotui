import { describe, expect, it } from 'vitest'
import { appConfigSchema, cliArgsSchema } from './config.js'

describe('appConfigSchema', () => {
	it('accepts valid config', () => {
		const result = appConfigSchema.parse({
			profile: 'dev',
			region: 'us-east-1',
			pageSize: 50,
		})
		expect(result.profile).toBe('dev')
		expect(result.region).toBe('us-east-1')
		expect(result.pageSize).toBe(50)
	})

	it('uses default pageSize', () => {
		const result = appConfigSchema.parse({})
		expect(result.pageSize).toBe(25)
	})

	it('rejects invalid pageSize', () => {
		expect(() => appConfigSchema.parse({ pageSize: 0 })).toThrow()
		expect(() => appConfigSchema.parse({ pageSize: 1001 })).toThrow()
	})

	it('allows optional fields', () => {
		const result = appConfigSchema.parse({})
		expect(result.profile).toBeUndefined()
		expect(result.region).toBeUndefined()
	})
})

describe('cliArgsSchema', () => {
	it('accepts valid args', () => {
		const result = cliArgsSchema.parse({
			profile: 'prod',
			region: 'eu-west-1',
			table: 'users',
		})
		expect(result.profile).toBe('prod')
		expect(result.table).toBe('users')
	})

	it('allows all optional', () => {
		const result = cliArgsSchema.parse({})
		expect(result.profile).toBeUndefined()
		expect(result.region).toBeUndefined()
		expect(result.table).toBeUndefined()
	})
})
