import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAwsRegions, getDefaultRegion, isValidRegion, listProfiles } from './aws-config.js'

describe('getAwsRegions', () => {
	it('returns list of regions', () => {
		const regions = getAwsRegions()
		expect(regions).toContain('us-east-1')
		expect(regions).toContain('eu-west-1')
		expect(regions.length).toBeGreaterThan(10)
	})

	it('returns readonly array', () => {
		const regions = getAwsRegions()
		expect(Array.isArray(regions)).toBe(true)
	})
})

describe('isValidRegion', () => {
	it('returns true for valid regions', () => {
		expect(isValidRegion('us-east-1')).toBe(true)
		expect(isValidRegion('eu-west-1')).toBe(true)
		expect(isValidRegion('ap-northeast-1')).toBe(true)
	})

	it('returns false for invalid regions', () => {
		expect(isValidRegion('invalid')).toBe(false)
		expect(isValidRegion('us-east-99')).toBe(false)
		expect(isValidRegion('')).toBe(false)
	})

	it('validates all supported regions', () => {
		const regions = getAwsRegions()
		for (const region of regions) {
			expect(isValidRegion(region)).toBe(true)
		}
	})
})

describe('listProfiles', () => {
	it('returns array of profiles', () => {
		const profiles = listProfiles()
		expect(Array.isArray(profiles)).toBe(true)
	})

	it('profile objects have name property', () => {
		const profiles = listProfiles()
		for (const profile of profiles) {
			expect(profile).toHaveProperty('name')
			expect(typeof profile.name).toBe('string')
		}
	})

	it('sorts profiles with default first', () => {
		const profiles = listProfiles()
		if (profiles.length > 0 && profiles.some((p) => p.name === 'default')) {
			expect(profiles[0]?.name).toBe('default')
		}
	})
})

describe('getDefaultRegion', () => {
	const originalEnv = process.env

	beforeEach(() => {
		vi.resetModules()
		process.env = { ...originalEnv }
	})

	afterEach(() => {
		process.env = originalEnv
	})

	it('returns us-east-1 as fallback', () => {
		delete process.env.AWS_REGION
		delete process.env.AWS_DEFAULT_REGION
		const region = getDefaultRegion('nonexistent-profile')
		expect(region).toBe('us-east-1')
	})

	it('returns region from profile if available', () => {
		const profiles = listProfiles()
		const profileWithRegion = profiles.find((p) => p.region)
		if (profileWithRegion) {
			const region = getDefaultRegion(profileWithRegion.name)
			expect(region).toBe(profileWithRegion.region)
		}
	})
})
