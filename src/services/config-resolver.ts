import type { ResolvedValue, RuntimeConfig } from '../types/config.js'
import { getDefaultRegion } from './aws-config.js'
import { loadUserConfig } from './user-config.js'

export type ResolutionInput = {
	cliProfile?: string
	cliRegion?: string
}

/**
 * Resolve profile/region with priority:
 * CLI args > env vars > config file > defaults
 */
export function resolveConfig(input: ResolutionInput): RuntimeConfig {
	const profile = resolveProfile(input.cliProfile)
	const region = resolveRegion(input.cliRegion, profile.value)
	return { profile, region }
}

function resolveProfile(cliProfile?: string): ResolvedValue<string | undefined> {
	// 1. CLI argument
	if (cliProfile) {
		return { value: cliProfile, source: 'cli' }
	}

	// 2. AWS_PROFILE env var
	const envProfile = process.env.AWS_PROFILE
	if (envProfile) {
		return { value: envProfile, source: 'env' }
	}

	// 3. Config file
	const config = loadUserConfig()
	if (config.profile) {
		return { value: config.profile, source: 'config' }
	}

	// 4. Default (undefined = use default profile)
	return { value: undefined, source: 'default' }
}

function resolveRegion(cliRegion?: string, profile?: string): ResolvedValue<string> {
	// 1. CLI argument
	if (cliRegion) {
		return { value: cliRegion, source: 'cli' }
	}

	// 2. AWS_REGION or AWS_DEFAULT_REGION env var
	const envRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION
	if (envRegion) {
		return { value: envRegion, source: 'env' }
	}

	// 3. Config file
	const config = loadUserConfig()
	if (config.region) {
		return { value: config.region, source: 'config' }
	}

	// 4. Default: derive from profile's configured region or fallback to us-east-1
	const defaultRegion = getDefaultRegion(profile)
	return { value: defaultRegion, source: 'default' }
}
