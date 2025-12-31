/**
 * Seed script for local DynamoDB
 * Creates test tables and populates with sample data
 */
import {
	CreateTableCommand,
	DeleteTableCommand,
	DynamoDBClient,
	ListTablesCommand,
	waitUntilTableExists,
} from '@aws-sdk/client-dynamodb'
import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

const ENDPOINT = process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8000'

const client = new DynamoDBClient({
	endpoint: ENDPOINT,
	region: 'local',
	credentials: {
		accessKeyId: 'local',
		secretAccessKey: 'local',
	},
})

const docClient = DynamoDBDocumentClient.from(client)

type TableConfig = {
	name: string
	keySchema: { AttributeName: string; KeyType: 'HASH' | 'RANGE' }[]
	attributes: { AttributeName: string; AttributeType: 'S' | 'N' }[]
	gsi?: {
		IndexName: string
		KeySchema: { AttributeName: string; KeyType: 'HASH' | 'RANGE' }[]
		Projection: { ProjectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE' }
	}[]
	lsi?: {
		IndexName: string
		KeySchema: { AttributeName: string; KeyType: 'HASH' | 'RANGE' }[]
		Projection: { ProjectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE' }
	}[]
	seedFn: () => Record<string, unknown>[]
}

const TABLES: TableConfig[] = [
	// Basic table - users/events
	{
		name: 'e2e-test-table',
		keySchema: [
			{ AttributeName: 'pk', KeyType: 'HASH' },
			{ AttributeName: 'sk', KeyType: 'RANGE' },
		],
		attributes: [
			{ AttributeName: 'pk', AttributeType: 'S' },
			{ AttributeName: 'sk', AttributeType: 'S' },
		],
		seedFn: () => {
			const items = []
			for (let i = 1; i <= 50; i++) {
				items.push({
					pk: `user_${String(i).padStart(3, '0')}`,
					sk: `event_${String(i).padStart(4, '0')}`,
					name: `User ${i}`,
					email: `user${i}@example.com`,
					status: i % 3 === 0 ? 'inactive' : 'active',
					age: 20 + (i % 50),
					createdAt: new Date(Date.now() - i * 86400000).toISOString(),
				})
			}
			return items
		},
	},

	// Orders table with GSI on customer_id + order_date
	{
		name: 'orders',
		keySchema: [
			{ AttributeName: 'order_id', KeyType: 'HASH' },
			{ AttributeName: 'item_id', KeyType: 'RANGE' },
		],
		attributes: [
			{ AttributeName: 'order_id', AttributeType: 'S' },
			{ AttributeName: 'item_id', AttributeType: 'S' },
			{ AttributeName: 'customer_id', AttributeType: 'S' },
			{ AttributeName: 'order_date', AttributeType: 'S' },
		],
		gsi: [
			{
				IndexName: 'customer-orders-index',
				KeySchema: [
					{ AttributeName: 'customer_id', KeyType: 'HASH' },
					{ AttributeName: 'order_date', KeyType: 'RANGE' },
				],
				Projection: { ProjectionType: 'ALL' },
			},
		],
		seedFn: () => {
			const items = []
			const statuses = ['pending', 'shipped', 'delivered', 'cancelled']
			for (let i = 1; i <= 40; i++) {
				const orderId = `ORD-${String(i).padStart(5, '0')}`
				const customerId = `CUST-${String((i % 10) + 1).padStart(3, '0')}`
				const itemCount = (i % 3) + 1
				for (let j = 1; j <= itemCount; j++) {
					items.push({
						order_id: orderId,
						item_id: `ITEM-${j}`,
						customer_id: customerId,
						order_date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
						product_name: `Product ${((i * j) % 20) + 1}`,
						quantity: (i % 5) + 1,
						price: Math.round((10 + ((i * j) % 90)) * 100) / 100,
						status: statuses[i % statuses.length],
					})
				}
			}
			return items
		},
	},

	// Products table with GSI on category, LSI on price
	{
		name: 'products',
		keySchema: [
			{ AttributeName: 'product_id', KeyType: 'HASH' },
			{ AttributeName: 'variant_id', KeyType: 'RANGE' },
		],
		attributes: [
			{ AttributeName: 'product_id', AttributeType: 'S' },
			{ AttributeName: 'variant_id', AttributeType: 'S' },
			{ AttributeName: 'category', AttributeType: 'S' },
			{ AttributeName: 'price', AttributeType: 'N' },
		],
		gsi: [
			{
				IndexName: 'category-index',
				KeySchema: [{ AttributeName: 'category', KeyType: 'HASH' }],
				Projection: { ProjectionType: 'ALL' },
			},
		],
		lsi: [
			{
				IndexName: 'price-index',
				KeySchema: [
					{ AttributeName: 'product_id', KeyType: 'HASH' },
					{ AttributeName: 'price', KeyType: 'RANGE' },
				],
				Projection: { ProjectionType: 'ALL' },
			},
		],
		seedFn: () => {
			const items = []
			const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports']
			const colors = ['Red', 'Blue', 'Green', 'Black', 'White']
			const sizes = ['S', 'M', 'L', 'XL']
			for (let i = 1; i <= 30; i++) {
				const productId = `PROD-${String(i).padStart(4, '0')}`
				const category = categories[i % categories.length]
				const variantCount = (i % 4) + 1
				for (let v = 1; v <= variantCount; v++) {
					items.push({
						product_id: productId,
						variant_id: `VAR-${v}`,
						name: `${category} Item ${i}`,
						category,
						color: colors[v % colors.length],
						size: sizes[v % sizes.length],
						price: Math.round((20 + i * 5 + v * 2) * 100) / 100,
						stock: (i * v) % 100,
						rating: Math.round((3 + (i % 20) / 10) * 10) / 10,
					})
				}
			}
			return items
		},
	},

	// Logs table with GSI on level + timestamp
	{
		name: 'application-logs',
		keySchema: [
			{ AttributeName: 'log_id', KeyType: 'HASH' },
			{ AttributeName: 'timestamp', KeyType: 'RANGE' },
		],
		attributes: [
			{ AttributeName: 'log_id', AttributeType: 'S' },
			{ AttributeName: 'timestamp', AttributeType: 'S' },
			{ AttributeName: 'level', AttributeType: 'S' },
			{ AttributeName: 'service', AttributeType: 'S' },
		],
		gsi: [
			{
				IndexName: 'level-timestamp-index',
				KeySchema: [
					{ AttributeName: 'level', KeyType: 'HASH' },
					{ AttributeName: 'timestamp', KeyType: 'RANGE' },
				],
				Projection: { ProjectionType: 'ALL' },
			},
			{
				IndexName: 'service-timestamp-index',
				KeySchema: [
					{ AttributeName: 'service', KeyType: 'HASH' },
					{ AttributeName: 'timestamp', KeyType: 'RANGE' },
				],
				Projection: { ProjectionType: 'ALL' },
			},
		],
		seedFn: () => {
			const items = []
			const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR']
			const services = ['api-gateway', 'auth-service', 'order-service', 'notification-service']
			const messages = [
				'Request processed successfully',
				'User authenticated',
				'Cache miss, fetching from database',
				'Rate limit exceeded',
				'Connection timeout',
				'Invalid input received',
				'Background job completed',
				'Webhook delivered',
			]
			for (let i = 1; i <= 100; i++) {
				const ts = new Date(Date.now() - i * 3600000) // 1 hour apart
				items.push({
					log_id: `LOG-${String(i).padStart(6, '0')}`,
					timestamp: ts.toISOString(),
					level: levels[i % levels.length],
					service: services[i % services.length],
					message: messages[i % messages.length],
					request_id: `req-${Math.random().toString(36).slice(2, 10)}`,
					duration_ms: Math.floor(Math.random() * 500) + 10,
					metadata: {
						ip: `192.168.1.${(i % 254) + 1}`,
						user_agent: i % 2 === 0 ? 'Mozilla/5.0' : 'curl/7.68.0',
					},
				})
			}
			return items
		},
	},
]

async function deleteTableIfExists(tableName: string): Promise<void> {
	try {
		const { TableNames } = await client.send(new ListTablesCommand({}))
		if (TableNames?.includes(tableName)) {
			console.log(`  Deleting existing table: ${tableName}`)
			await client.send(new DeleteTableCommand({ TableName: tableName }))
			await new Promise((r) => setTimeout(r, 500))
		}
	} catch {
		// Table doesn't exist
	}
}

async function createTable(config: TableConfig): Promise<void> {
	console.log(`  Creating table: ${config.name}`)

	const command = new CreateTableCommand({
		TableName: config.name,
		KeySchema: config.keySchema,
		AttributeDefinitions: config.attributes,
		BillingMode: 'PAY_PER_REQUEST',
		GlobalSecondaryIndexes: config.gsi,
		LocalSecondaryIndexes: config.lsi,
	})

	await client.send(command)
	await waitUntilTableExists({ client, maxWaitTime: 30 }, { TableName: config.name })
}

async function seedTable(config: TableConfig): Promise<void> {
	const items = config.seedFn()
	console.log(`  Seeding ${items.length} items...`)

	// BatchWrite in chunks of 25 with retry for unprocessed items
	for (let i = 0; i < items.length; i += 25) {
		const batch = items.slice(i, i + 25)
		let requestItems: Record<string, unknown[]> | undefined = {
			[config.name]: batch.map((item) => ({
				PutRequest: { Item: item },
			})),
		}

		let retries = 0
		while (requestItems && Object.keys(requestItems).length > 0 && retries < 5) {
			const result = await docClient.send(new BatchWriteCommand({ RequestItems: requestItems }))
			requestItems = result.UnprocessedItems as Record<string, unknown[]> | undefined
			if (requestItems && Object.keys(requestItems).length > 0) {
				retries++
				await new Promise((r) => setTimeout(r, 100 * retries))
			}
		}

		if (requestItems && Object.keys(requestItems).length > 0) {
			throw new Error(`Failed to write all items after 5 retries`)
		}
	}
}

async function main(): Promise<void> {
	console.log(`Using DynamoDB endpoint: ${ENDPOINT}\n`)

	try {
		for (const table of TABLES) {
			console.log(`[${table.name}]`)
			await deleteTableIfExists(table.name)
			await createTable(table)
			await seedTable(table)
			const indexes = (table.gsi?.length ?? 0) + (table.lsi?.length ?? 0)
			console.log(`  Done (${indexes} indexes)\n`)
		}
		console.log('All tables ready!')
	} catch (error) {
		console.error('Failed to seed database:', error)
		process.exit(1)
	}
}

main()
