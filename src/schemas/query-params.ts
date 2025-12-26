import { z } from 'zod'

export const sortKeyOperatorSchema = z.enum([
	'eq',
	'lt',
	'lte',
	'gt',
	'gte',
	'between',
	'begins_with',
])

export type SortKeyOperator = z.infer<typeof sortKeyOperatorSchema>

// Filter operators for FilterExpression (non-key attributes)
export const filterOperatorSchema = z.enum([
	'eq',
	'ne',
	'lt',
	'lte',
	'gt',
	'gte',
	'between',
	'begins_with',
	'contains',
	'attribute_exists',
	'attribute_not_exists',
])

export type FilterOperator = z.infer<typeof filterOperatorSchema>

export const filterConditionSchema = z.object({
	attribute: z.string().min(1),
	operator: filterOperatorSchema,
	value: z.union([z.string(), z.number(), z.boolean()]).optional(),
	value2: z.union([z.string(), z.number()]).optional(), // for 'between' operator
})

export type FilterCondition = z.infer<typeof filterConditionSchema>

export const queryParamsSchema = z.object({
	tableName: z.string().min(1),
	partitionKey: z.object({
		name: z.string().min(1),
		value: z.union([z.string(), z.number()]),
	}),
	sortKey: z
		.object({
			name: z.string().min(1),
			value: z.union([z.string(), z.number()]),
			operator: sortKeyOperatorSchema.default('eq'),
			valueTo: z.union([z.string(), z.number()]).optional(),
		})
		.optional(),
	filterConditions: z.array(filterConditionSchema).optional(),
	limit: z.number().int().min(1).max(1000).optional(),
	scanIndexForward: z.boolean().optional(),
	indexName: z.string().optional(),
})

export type QueryParamsInput = z.input<typeof queryParamsSchema>
export type QueryParams = z.infer<typeof queryParamsSchema>

export const scanParamsSchema = z.object({
	tableName: z.string().min(1),
	limit: z.number().int().min(1).max(1000).optional(),
	filterExpression: z.string().optional(),
	expressionAttributeNames: z.record(z.string(), z.string()).optional(),
	expressionAttributeValues: z.record(z.string(), z.any()).optional(),
})

export type ScanParamsInput = z.input<typeof scanParamsSchema>
export type ScanParams = z.infer<typeof scanParamsSchema>
