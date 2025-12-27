import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export type UserConfig = {
	profile?: string
	region?: string
	pageSize?: number
}

const CONFIG_DIR = join(homedir(), '.config', 'dynotui')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')

export function loadUserConfig(): UserConfig {
	if (!existsSync(CONFIG_PATH)) {
		return {}
	}

	try {
		const content = readFileSync(CONFIG_PATH, 'utf-8')
		const parsed = JSON.parse(content) as unknown
		if (typeof parsed !== 'object' || parsed === null) {
			return {}
		}
		const obj = parsed as Record<string, unknown>
		return {
			profile: typeof obj.profile === 'string' ? obj.profile : undefined,
			region: typeof obj.region === 'string' ? obj.region : undefined,
			pageSize: typeof obj.pageSize === 'number' ? obj.pageSize : undefined,
		}
	} catch (err) {
		console.error('Failed to load user config:', err)
		return {}
	}
}

export function saveUserConfig(config: UserConfig): void {
	try {
		const dir = dirname(CONFIG_PATH)
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true })
		}
		writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, '\t')}\n`)
	} catch (err) {
		console.error('Failed to save user config:', err)
	}
}
