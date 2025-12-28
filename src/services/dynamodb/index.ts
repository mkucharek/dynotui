export { type ClientConfig, createClient, resetClient } from './client.js'
export {
	type DynamoDBErrorType,
	getErrorDisplayMessage,
	type ParsedDynamoDBError,
	parseDynamoDBError,
} from './errors.js'
export {
	buildFilterExpression,
	type QueryParams,
	type QueryResult,
	query,
} from './query.js'
export { type ScanParams, type ScanResult, scan } from './scan.js'
export {
	describeTable,
	getTableInfo,
	type ListTablesResult,
	listTables,
	type TableInfo,
} from './tables.js'
