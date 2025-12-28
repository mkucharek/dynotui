export type ConfigSource = 'cli' | 'env' | 'config' | 'default'

export type ResolvedValue<T> = {
	value: T
	source: ConfigSource
}

export type RuntimeConfig = {
	profile: ResolvedValue<string | undefined>
	region: ResolvedValue<string>
}

export type ConfigDefaults = {
	profile?: string
	region?: string
	pageSize: number
}

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
