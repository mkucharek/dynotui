import {
	DescribeTableCommand,
	type GlobalSecondaryIndexDescription,
	ListTablesCommand,
	type LocalSecondaryIndexDescription,
	type TableDescription,
} from '@aws-sdk/client-dynamodb'
import { type ClientConfig, createClient } from './client.js'

export type ListTablesResult = {
	tables: string[]
	lastTableName?: string
}

export async function listTables(
	config: ClientConfig = {},
	startTableName?: string,
	limit = 100,
): Promise<ListTablesResult> {
	const client = createClient(config)

	const command = new ListTablesCommand({
		ExclusiveStartTableName: startTableName,
		Limit: limit,
	})

	const response = await client.send(command)

	return {
		tables: response.TableNames ?? [],
		lastTableName: response.LastEvaluatedTableName,
	}
}

export async function describeTable(
	tableName: string,
	config: ClientConfig = {},
): Promise<TableDescription> {
	const client = createClient(config)

	const command = new DescribeTableCommand({
		TableName: tableName,
	})

	const response = await client.send(command)

	if (!response.Table) {
		throw new Error(`Table ${tableName} not found`)
	}

	return response.Table
}

export type IndexInfo = {
	name: string
	type: 'GSI' | 'LSI'
	partitionKey: string
	sortKey?: string
	projection: 'ALL' | 'KEYS_ONLY' | 'INCLUDE'
	status?: 'CREATING' | 'ACTIVE' | 'DELETING' | 'UPDATING'
}

export type TableInfo = {
	name: string
	status: string
	itemCount: number
	sizeBytes: number
	partitionKey: string
	sortKey?: string
	indexes: IndexInfo[]
}

function extractIndexInfo(
	indexDesc: GlobalSecondaryIndexDescription | LocalSecondaryIndexDescription,
	type: 'GSI' | 'LSI',
): IndexInfo {
	const keySchema = indexDesc.KeySchema ?? []
	const pk = keySchema.find((k) => k.KeyType === 'HASH')?.AttributeName ?? ''
	const sk = keySchema.find((k) => k.KeyType === 'RANGE')?.AttributeName
	const projection = indexDesc.Projection

	return {
		name: indexDesc.IndexName ?? '',
		type,
		partitionKey: pk,
		sortKey: sk,
		projection: (projection?.ProjectionType as 'ALL' | 'KEYS_ONLY' | 'INCLUDE') ?? 'ALL',
		status: type === 'GSI' ? (indexDesc as GlobalSecondaryIndexDescription).IndexStatus : undefined,
	}
}

export async function getTableInfo(
	tableName: string,
	config: ClientConfig = {},
): Promise<TableInfo> {
	const table = await describeTable(tableName, config)

	const keySchema = table.KeySchema ?? []
	const partitionKey = keySchema.find((k) => k.KeyType === 'HASH')?.AttributeName ?? ''
	const sortKey = keySchema.find((k) => k.KeyType === 'RANGE')?.AttributeName

	// Extract GSIs (only ACTIVE ones are queryable)
	const gsis = (table.GlobalSecondaryIndexes ?? [])
		.filter((gsi) => gsi.IndexStatus === 'ACTIVE')
		.map((gsi) => extractIndexInfo(gsi, 'GSI'))

	// Extract LSIs (always available)
	const lsis = (table.LocalSecondaryIndexes ?? []).map((lsi) => extractIndexInfo(lsi, 'LSI'))

	return {
		name: table.TableName ?? tableName,
		status: table.TableStatus ?? 'UNKNOWN',
		itemCount: table.ItemCount ?? 0,
		sizeBytes: table.TableSizeBytes ?? 0,
		partitionKey,
		sortKey,
		indexes: [...gsis, ...lsis],
	}
}
