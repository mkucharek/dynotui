import { Box, Text } from 'ink'
import type { FilterCondition, QueryParams } from '../../schemas/query-params.js'
import { colors } from '../../theme.js'

export type QueryFilterSummaryProps = {
	mode: 'scan' | 'query'
	queryParams?: QueryParams | null
	filterConditions?: FilterCondition[]
}

const operatorLabels: Record<string, string> = {
	eq: '=',
	ne: '≠',
	lt: '<',
	lte: '≤',
	gt: '>',
	gte: '≥',
	between: 'between',
	begins_with: 'begins with',
	contains: 'contains',
	attribute_exists: 'exists',
	attribute_not_exists: 'not exists',
}

function formatOperator(op: string): string {
	return operatorLabels[op] ?? op
}

function formatValue(value: unknown): string {
	if (value === undefined || value === null) return ''
	if (typeof value === 'string') return `"${value}"`
	return String(value)
}

export function QueryFilterSummary({
	mode,
	queryParams,
	filterConditions = [],
}: QueryFilterSummaryProps) {
	const hasQuery = mode === 'query' && queryParams
	const hasFilters = filterConditions.length > 0

	if (!hasQuery && !hasFilters) {
		return null
	}

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor={colors.border}
			paddingX={1}
			marginY={0}
		>
			{/* Query section */}
			{hasQuery && queryParams && (
				<Box flexDirection="column">
					<Text color={colors.focus} bold>
						Query
					</Text>
					<Box gap={2} flexWrap="wrap">
						{/* Partition key */}
						<Text>
							<Text color={colors.dataKey}>{queryParams.partitionKey.name}</Text>
							<Text color={colors.textSecondary}> = </Text>
							<Text color={colors.dataValue}>{formatValue(queryParams.partitionKey.value)}</Text>
						</Text>

						{/* Sort key */}
						{queryParams.sortKey && (
							<Text>
								<Text color={colors.dataKey}>{queryParams.sortKey.name}</Text>
								<Text color={colors.textSecondary}>
									{' '}
									{formatOperator(queryParams.sortKey.operator)}{' '}
								</Text>
								<Text color={colors.dataValue}>{formatValue(queryParams.sortKey.value)}</Text>
								{queryParams.sortKey.operator === 'between' &&
									queryParams.sortKey.valueTo !== undefined && (
										<>
											<Text color={colors.textSecondary}> and </Text>
											<Text color={colors.dataValue}>
												{formatValue(queryParams.sortKey.valueTo)}
											</Text>
										</>
									)}
							</Text>
						)}
					</Box>
				</Box>
			)}

			{/* Filter section */}
			{hasFilters && (
				<Box flexDirection="column">
					<Text color={colors.brand} bold>
						{mode === 'scan' ? 'Scan Filter' : 'Filter'}
					</Text>
					<Box gap={2} flexWrap="wrap">
						{filterConditions.map((condition, i) => (
							<Text key={`${condition.attribute}-${i}`}>
								<Text color={colors.dataKey}>{condition.attribute}</Text>
								<Text color={colors.textSecondary}> {formatOperator(condition.operator)} </Text>
								{condition.operator !== 'attribute_exists' &&
									condition.operator !== 'attribute_not_exists' && (
										<>
											<Text color={colors.dataValue}>{formatValue(condition.value)}</Text>
											{condition.operator === 'between' && condition.value2 !== undefined && (
												<>
													<Text color={colors.textSecondary}> and </Text>
													<Text color={colors.dataValue}>{formatValue(condition.value2)}</Text>
												</>
											)}
										</>
									)}
							</Text>
						))}
					</Box>
				</Box>
			)}
		</Box>
	)
}
