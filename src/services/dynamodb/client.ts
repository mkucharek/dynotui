import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { fromIni } from '@aws-sdk/credential-providers'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

export type ClientConfig = {
	profile?: string
	region?: string
	endpoint?: string
}

let cachedClient: DynamoDBDocumentClient | null = null
let cachedConfig: ClientConfig = {}

function configChanged(config: ClientConfig): boolean {
	return (
		config.profile !== cachedConfig.profile ||
		config.region !== cachedConfig.region ||
		config.endpoint !== cachedConfig.endpoint
	)
}

export function createClient(config: ClientConfig = {}): DynamoDBDocumentClient {
	// Check for local DynamoDB endpoint from env var
	const endpoint = config.endpoint ?? process.env.DYNAMODB_ENDPOINT

	if (cachedClient && !configChanged({ ...config, endpoint })) {
		return cachedClient
	}

	const clientConfig: ConstructorParameters<typeof DynamoDBClient>[0] = {}

	if (config.region) {
		clientConfig.region = config.region
	}

	// Local DynamoDB setup
	if (endpoint) {
		clientConfig.endpoint = endpoint
		// Local DynamoDB doesn't need real credentials
		clientConfig.credentials = {
			accessKeyId: 'local',
			secretAccessKey: 'local',
		}
		clientConfig.region = config.region ?? 'local'
	} else if (config.profile) {
		clientConfig.credentials = fromIni({ profile: config.profile })
	}

	const baseClient = new DynamoDBClient(clientConfig)
	cachedClient = DynamoDBDocumentClient.from(baseClient, {
		marshallOptions: {
			removeUndefinedValues: true,
		},
	})
	cachedConfig = { ...config, endpoint }

	return cachedClient
}

export function resetClient(): void {
	cachedClient = null
	cachedConfig = {}
}
