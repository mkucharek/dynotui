/**
 * Source of a resolved config value
 */
export type ConfigSource = 'cli' | 'env' | 'config' | 'default'

/**
 * A resolved value with its source
 */
export type ResolvedValue<T> = {
	value: T
	source: ConfigSource
}

/**
 * Runtime config with source tracking
 */
export type RuntimeConfig = {
	profile: ResolvedValue<string | undefined>
	region: ResolvedValue<string>
}

/**
 * Config defaults persisted to file
 */
export type ConfigDefaults = {
	profile?: string
	region?: string
	pageSize: number
}

/**
 * Get human-readable label for config source
 */
export function getSourceLabel(source: ConfigSource): string {
	switch (source) {
		case 'cli':
			return 'CLI argument'
		case 'env':
			return 'Environment variable'
		case 'config':
			return 'Config file'
		case 'default':
			return 'Default'
	}
}
