import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import { type ClientConfig, createClient } from './client.js'

export type ScanParams = {
	tableName: string
	limit?: number
	exclusiveStartKey?: Record<string, unknown>
	filterExpression?: string
	expressionAttributeNames?: Record<string, string>
	expressionAttributeValues?: Record<string, unknown>
}

export type ScanResult = {
	items: Record<string, unknown>[]
	lastEvaluatedKey?: Record<string, unknown>
	count: number
	scannedCount: number
}

export async function scan(params: ScanParams, config: ClientConfig = {}): Promise<ScanResult> {
	const client = createClient(config)

	const command = new ScanCommand({
		TableName: params.tableName,
		Limit: params.limit,
		ExclusiveStartKey: params.exclusiveStartKey,
		FilterExpression: params.filterExpression,
		ExpressionAttributeNames: params.expressionAttributeNames,
		ExpressionAttributeValues: params.expressionAttributeValues,
	})

	const response = await client.send(command)

	return {
		items: (response.Items ?? []) as Record<string, unknown>[],
		lastEvaluatedKey: response.LastEvaluatedKey as Record<string, unknown> | undefined,
		count: response.Count ?? 0,
		scannedCount: response.ScannedCount ?? 0,
	}
}

export type PaginatedScanState = {
	params: ScanParams
	config: ClientConfig
	lastEvaluatedKey?: Record<string, unknown>
	hasMore: boolean
}

export function createPaginatedScan(
	params: ScanParams,
	config: ClientConfig = {},
): PaginatedScanState {
	return {
		params,
		config,
		lastEvaluatedKey: undefined,
		hasMore: true,
	}
}

export async function fetchNextPage(state: PaginatedScanState): Promise<{
	result: ScanResult
	nextState: PaginatedScanState
}> {
	const result = await scan(
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
