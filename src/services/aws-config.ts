import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export type AwsProfile = {
	name: string
	region?: string
}

const AWS_REGIONS = [
	'us-east-1',
	'us-east-2',
	'us-west-1',
	'us-west-2',
	'eu-west-1',
	'eu-west-2',
	'eu-west-3',
	'eu-central-1',
	'eu-north-1',
	'ap-northeast-1',
	'ap-northeast-2',
	'ap-northeast-3',
	'ap-southeast-1',
	'ap-southeast-2',
	'ap-south-1',
	'sa-east-1',
	'ca-central-1',
] as const

export type AwsRegion = (typeof AWS_REGIONS)[number]

export function getAwsRegions(): readonly string[] {
	return AWS_REGIONS
}

export function isValidRegion(region: string): region is AwsRegion {
	return AWS_REGIONS.includes(region as AwsRegion)
}

function parseIniFile(content: string): Record<string, Record<string, string>> {
	const result: Record<string, Record<string, string>> = {}
	let currentSection = ''

	for (const line of content.split('\n')) {
		const trimmed = line.trim()

		if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
			continue
		}

		const sectionMatch = trimmed.match(/^\[(.+)\]$/)
		if (sectionMatch?.[1]) {
			currentSection = sectionMatch[1]
			result[currentSection] = {}
			continue
		}

		const keyValueMatch = trimmed.match(/^([^=]+)=(.*)$/)
		if (keyValueMatch?.[1] && currentSection) {
			const key = keyValueMatch[1].trim()
			const value = keyValueMatch[2]?.trim() ?? ''
			const section = result[currentSection]
			if (section) {
				section[key] = value
			}
		}
	}

	return result
}

export function listProfiles(): AwsProfile[] {
	const profiles: AwsProfile[] = []
	const configPath = join(homedir(), '.aws', 'config')
	const credentialsPath = join(homedir(), '.aws', 'credentials')

	const profileNames = new Set<string>()

	if (existsSync(credentialsPath)) {
		try {
			const content = readFileSync(credentialsPath, 'utf-8')
			const parsed = parseIniFile(content)
			for (const section of Object.keys(parsed)) {
				profileNames.add(section)
			}
		} catch {
			// ignore
		}
	}

	if (existsSync(configPath)) {
		try {
			const content = readFileSync(configPath, 'utf-8')
			const parsed = parseIniFile(content)
			for (const [section, values] of Object.entries(parsed)) {
				const profileName = section.replace(/^profile\s+/, '')
				profileNames.add(profileName)

				const existing = profiles.find((p) => p.name === profileName)
				if (existing) {
					existing.region = values.region
				} else {
					profiles.push({
						name: profileName,
						region: values.region,
					})
				}
			}
		} catch {
			// ignore
		}
	}

	for (const name of profileNames) {
		if (!profiles.find((p) => p.name === name)) {
			profiles.push({ name })
		}
	}

	return profiles.sort((a, b) => {
		if (a.name === 'default') return -1
		if (b.name === 'default') return 1
		return a.name.localeCompare(b.name)
	})
}

export function getDefaultRegion(profile?: string): string {
	const profiles = listProfiles()
	const found = profiles.find((p) => p.name === (profile ?? 'default'))
	return found?.region ?? process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1'
}
