import { beforeEach, describe, expect, it } from 'vitest'
import { createClient, resetClient } from './client.js'

describe('createClient', () => {
	beforeEach(() => {
		resetClient()
	})

	it('creates a client with default config', () => {
		const client = createClient()
		expect(client).toBeDefined()
	})

	it('creates a client with region', () => {
		const client = createClient({ region: 'eu-west-1' })
		expect(client).toBeDefined()
	})

	it('caches the client for same config', () => {
		const client1 = createClient({ region: 'us-east-1' })
		const client2 = createClient({ region: 'us-east-1' })
		expect(client1).toBe(client2)
	})

	it('creates new client when config changes', () => {
		const client1 = createClient({ region: 'us-east-1' })
		const client2 = createClient({ region: 'eu-west-1' })
		expect(client1).not.toBe(client2)
	})

	it('creates new client when profile changes', () => {
		const client1 = createClient({ profile: 'default' })
		const client2 = createClient({ profile: 'other' })
		expect(client1).not.toBe(client2)
	})
})

describe('resetClient', () => {
	it('clears cached client', () => {
		const client1 = createClient({ region: 'us-east-1' })
		resetClient()
		const client2 = createClient({ region: 'us-east-1' })
		expect(client1).not.toBe(client2)
	})
})
