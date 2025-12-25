import {
	DescribeTableCommand,
	ListTablesCommand,
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

export type TableInfo = {
	name: string
	status: string
	itemCount: number
	sizeBytes: number
	partitionKey: string
	sortKey?: string
}

export async function getTableInfo(
	tableName: string,
	config: ClientConfig = {},
): Promise<TableInfo> {
	const table = await describeTable(tableName, config)

	const keySchema = table.KeySchema ?? []
	const partitionKey = keySchema.find((k) => k.KeyType === 'HASH')?.AttributeName ?? ''
	const sortKey = keySchema.find((k) => k.KeyType === 'RANGE')?.AttributeName

	return {
		name: table.TableName ?? tableName,
		status: table.TableStatus ?? 'UNKNOWN',
		itemCount: table.ItemCount ?? 0,
		sizeBytes: table.TableSizeBytes ?? 0,
		partitionKey,
		sortKey,
	}
}
