#!/usr/bin/env tsx
import { getDefaultRegion, listProfiles } from '../src/services/aws-config.js'
import { getTableInfo, listTables } from '../src/services/dynamodb/index.js'

async function main() {
	console.log('=== AWS Config ===')
	const profiles = listProfiles()
	console.log('Profiles:', profiles.map((p) => p.name).join(', ') || '(none found)')

	const defaultRegion = getDefaultRegion()
	console.log('Default region:', defaultRegion)

	console.log('\n=== DynamoDB Tables ===')
	try {
		const result = await listTables({ region: defaultRegion })
		if (result.tables.length === 0) {
			console.log('No tables found in', defaultRegion)
		} else {
			console.log(`Found ${result.tables.length} table(s):`)
			for (const table of result.tables.slice(0, 5)) {
				console.log(`  - ${table}`)
				try {
					const info = await getTableInfo(table, { region: defaultRegion })
					console.log(`    PK: ${info.partitionKey}${info.sortKey ? `, SK: ${info.sortKey}` : ''}`)
					console.log(`    Items: ${info.itemCount}, Size: ${(info.sizeBytes / 1024).toFixed(1)}KB`)
				} catch (_e) {
					console.log(`    (could not get details)`)
				}
			}
			if (result.tables.length > 5) {
				console.log(`  ... and ${result.tables.length - 5} more`)
			}
		}
	} catch (err) {
		const error = err as Error
		console.error('Error:', error.message)
		if (error.message.includes('Could not load credentials')) {
			console.log('\nHint: Configure AWS credentials via:')
			console.log('  - ~/.aws/credentials file')
			console.log('  - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars')
			console.log('  - AWS SSO / IAM role')
		}
	}
}

main()
