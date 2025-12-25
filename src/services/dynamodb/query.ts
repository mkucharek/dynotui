import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { type ClientConfig, createClient } from './client.js'

export type QueryParams = {
	tableName: string
	partitionKey: {
		name: string
		value: string | number
	}
	sortKey?: {
		name: string
		value: string | number
		operator?: 'eq' | 'lt' | 'lte' | 'gt' | 'gte' | 'between' | 'begins_with'
		valueTo?: string | number // for 'between' operator
	}
	limit?: number
	exclusiveStartKey?: Record<string, unknown>
	scanIndexForward?: boolean
	indexName?: string
}

export type QueryResult = {
	items: Record<string, unknown>[]
	lastEvaluatedKey?: Record<string, unknown>
	count: number
	scannedCount: number
}

function buildKeyConditionExpression(params: QueryParams): {
	keyConditionExpression: string
	expressionAttributeNames: Record<string, string>
	expressionAttributeValues: Record<string, unknown>
} {
	const expressionAttributeNames: Record<string, string> = {
		'#pk': params.partitionKey.name,
	}
	const expressionAttributeValues: Record<string, unknown> = {
		':pk': params.partitionKey.value,
	}

	let keyConditionExpression = '#pk = :pk'

	if (params.sortKey) {
		expressionAttributeNames['#sk'] = params.sortKey.name
		expressionAttributeValues[':sk'] = params.sortKey.value

		const operator = params.sortKey.operator ?? 'eq'

		switch (operator) {
			case 'eq':
				keyConditionExpression += ' AND #sk = :sk'
				break
			case 'lt':
				keyConditionExpression += ' AND #sk < :sk'
				break
			case 'lte':
				keyConditionExpression += ' AND #sk <= :sk'
				break
			case 'gt':
				keyConditionExpression += ' AND #sk > :sk'
				break
			case 'gte':
				keyConditionExpression += ' AND #sk >= :sk'
				break
			case 'between':
				expressionAttributeValues[':sk2'] = params.sortKey.valueTo
				keyConditionExpression += ' AND #sk BETWEEN :sk AND :sk2'
				break
			case 'begins_with':
				keyConditionExpression += ' AND begins_with(#sk, :sk)'
				break
		}
	}

	return {
		keyConditionExpression,
		expressionAttributeNames,
		expressionAttributeValues,
	}
}

export async function query(params: QueryParams, config: ClientConfig = {}): Promise<QueryResult> {
	const client = createClient(config)

	const { keyConditionExpression, expressionAttributeNames, expressionAttributeValues } =
		buildKeyConditionExpression(params)

	const command = new QueryCommand({
		TableName: params.tableName,
		IndexName: params.indexName,
		KeyConditionExpression: keyConditionExpression,
		ExpressionAttributeNames: expressionAttributeNames,
		ExpressionAttributeValues: expressionAttributeValues,
		Limit: params.limit,
		ExclusiveStartKey: params.exclusiveStartKey,
		ScanIndexForward: params.scanIndexForward,
	})

	const response = await client.send(command)

	return {
		items: (response.Items ?? []) as Record<string, unknown>[],
		lastEvaluatedKey: response.LastEvaluatedKey as Record<string, unknown> | undefined,
		count: response.Count ?? 0,
		scannedCount: response.ScannedCount ?? 0,
	}
}

export type PaginatedQueryState = {
	params: QueryParams
	config: ClientConfig
	lastEvaluatedKey?: Record<string, unknown>
	hasMore: boolean
}

export function createPaginatedQuery(
	params: QueryParams,
	config: ClientConfig = {},
): PaginatedQueryState {
	return {
		params,
		config,
		lastEvaluatedKey: undefined,
		hasMore: true,
	}
}

export async function fetchNextQueryPage(state: PaginatedQueryState): Promise<{
	result: QueryResult
	nextState: PaginatedQueryState
}> {
	const result = await query(
		{
			...state.params,
			exclusiveStartKey: state.lastEvaluatedKey,
		},
		state.config,
	)

	return {
		result,
		nextState: {
			...state,
			lastEvaluatedKey: result.lastEvaluatedKey,
			hasMore: result.lastEvaluatedKey !== undefined,
		},
	}
}
