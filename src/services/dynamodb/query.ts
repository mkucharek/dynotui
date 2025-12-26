import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { FilterCondition, FilterOperator } from '../../schemas/query-params.js'
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
	filterConditions?: FilterCondition[]
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

function buildFilterConditionClause(
	condition: FilterCondition,
	index: number,
): {
	clause: string
	attrName: Record<string, string>
	attrValue: Record<string, unknown>
} {
	const nameKey = `#f${index}`
	const valueKey = `:f${index}`
	const valueKey2 = `:f${index}b`

	const attrName: Record<string, string> = { [nameKey]: condition.attribute }
	const attrValue: Record<string, unknown> = {}

	let clause: string

	const op: FilterOperator = condition.operator

	switch (op) {
		case 'eq':
			clause = `${nameKey} = ${valueKey}`
			attrValue[valueKey] = condition.value
			break
		case 'ne':
			clause = `${nameKey} <> ${valueKey}`
			attrValue[valueKey] = condition.value
			break
		case 'lt':
			clause = `${nameKey} < ${valueKey}`
			attrValue[valueKey] = condition.value
			break
		case 'lte':
			clause = `${nameKey} <= ${valueKey}`
			attrValue[valueKey] = condition.value
			break
		case 'gt':
			clause = `${nameKey} > ${valueKey}`
			attrValue[valueKey] = condition.value
			break
		case 'gte':
			clause = `${nameKey} >= ${valueKey}`
			attrValue[valueKey] = condition.value
			break
		case 'between':
			clause = `${nameKey} BETWEEN ${valueKey} AND ${valueKey2}`
			attrValue[valueKey] = condition.value
			attrValue[valueKey2] = condition.value2
			break
		case 'begins_with':
			clause = `begins_with(${nameKey}, ${valueKey})`
			attrValue[valueKey] = condition.value
			break
		case 'contains':
			clause = `contains(${nameKey}, ${valueKey})`
			attrValue[valueKey] = condition.value
			break
		case 'attribute_exists':
			clause = `attribute_exists(${nameKey})`
			break
		case 'attribute_not_exists':
			clause = `attribute_not_exists(${nameKey})`
			break
		default: {
			// Exhaustive check
			const _exhaustive: never = op
			throw new Error(`Unknown filter operator: ${_exhaustive}`)
		}
	}

	return { clause, attrName, attrValue }
}

export function buildFilterExpression(conditions: FilterCondition[]): {
	filterExpression: string
	expressionAttributeNames: Record<string, string>
	expressionAttributeValues: Record<string, unknown> | undefined
} | null {
	if (!conditions || conditions.length === 0) {
		return null
	}

	const clauses: string[] = []
	const expressionAttributeNames: Record<string, string> = {}
	const expressionAttributeValues: Record<string, unknown> = {}

	for (let i = 0; i < conditions.length; i++) {
		const { clause, attrName, attrValue } = buildFilterConditionClause(conditions[i], i)
		clauses.push(clause)
		Object.assign(expressionAttributeNames, attrName)
		Object.assign(expressionAttributeValues, attrValue)
	}

	return {
		filterExpression: clauses.join(' AND '),
		expressionAttributeNames,
		// DynamoDB rejects empty ExpressionAttributeValues, return undefined if empty
		expressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
	}
}

export async function query(params: QueryParams, config: ClientConfig = {}): Promise<QueryResult> {
	const client = createClient(config)

	const { keyConditionExpression, expressionAttributeNames, expressionAttributeValues } =
		buildKeyConditionExpression(params)

	// Build filter expression if filter conditions provided
	const filterResult = params.filterConditions
		? buildFilterExpression(params.filterConditions)
		: null

	// Merge attribute names and values
	const mergedNames = filterResult
		? { ...expressionAttributeNames, ...filterResult.expressionAttributeNames }
		: expressionAttributeNames
	const mergedValues = filterResult
		? { ...expressionAttributeValues, ...filterResult.expressionAttributeValues }
		: expressionAttributeValues

	const command = new QueryCommand({
		TableName: params.tableName,
		IndexName: params.indexName,
		KeyConditionExpression: keyConditionExpression,
		FilterExpression: filterResult?.filterExpression,
		ExpressionAttributeNames: mergedNames,
		ExpressionAttributeValues: mergedValues,
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
