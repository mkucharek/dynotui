import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { fromIni } from '@aws-sdk/credential-providers'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

export type ClientConfig = {
	profile?: string
	region?: string
}

let cachedClient: DynamoDBDocumentClient | null = null
let cachedConfig: ClientConfig = {}

function configChanged(config: ClientConfig): boolean {
	return config.profile !== cachedConfig.profile || config.region !== cachedConfig.region
}

export function createClient(config: ClientConfig = {}): DynamoDBDocumentClient {
	if (cachedClient && !configChanged(config)) {
		return cachedClient
	}

	const clientConfig: ConstructorParameters<typeof DynamoDBClient>[0] = {}

	if (config.region) {
		clientConfig.region = config.region
	}

	if (config.profile) {
		clientConfig.credentials = fromIni({ profile: config.profile })
	}

	const baseClient = new DynamoDBClient(clientConfig)
	cachedClient = DynamoDBDocumentClient.from(baseClient, {
		marshallOptions: {
			removeUndefinedValues: true,
		},
	})
	cachedConfig = { ...config }

	return cachedClient
}

export function resetClient(): void {
	cachedClient = null
	cachedConfig = {}
}
