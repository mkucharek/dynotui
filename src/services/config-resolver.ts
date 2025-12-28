import type { ResolvedValue, RuntimeConfig } from '../types/config.js'
import { getDefaultRegion } from './aws-config.js'
import { loadUserConfig, type UserConfig } from './user-config.js'

export type ResolutionInput = {
	cliProfile?: string
	cliRegion?: string
}

export function resolveConfig(input: ResolutionInput): RuntimeConfig {
	const config = loadUserConfig()
	const profile = resolveProfile(input.cliProfile, config)
	const region = resolveRegion(input.cliRegion, profile.value, config)
	return { profile, region }
}

function resolveProfile(
	cliProfile: string | undefined,
	config: UserConfig,
): ResolvedValue<string | undefined> {
	if (cliProfile) return { value: cliProfile, source: 'cli' }
	const envProfile = process.env.AWS_PROFILE
	if (envProfile) return { value: envProfile, source: 'env' }
	if (config.profile) return { value: config.profile, source: 'config' }
	return { value: undefined, source: 'default' }
}

function resolveRegion(
	cliRegion: string | undefined,
	profile: string | undefined,
	config: UserConfig,
): ResolvedValue<string> {
	if (cliRegion) return { value: cliRegion, source: 'cli' }
	const envRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION
	if (envRegion) return { value: envRegion, source: 'env' }
	if (config.region) return { value: config.region, source: 'config' }
	return { value: getDefaultRegion(profile), source: 'default' }
}
