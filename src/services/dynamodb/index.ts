export { type ClientConfig, createClient, resetClient } from './client.js'
export {
	createPaginatedQuery,
	fetchNextQueryPage,
	type PaginatedQueryState,
	type QueryParams,
	type QueryResult,
	query,
} from './query.js'
export {
	createPaginatedScan,
	fetchNextPage,
	type PaginatedScanState,
	type ScanParams,
	type ScanResult,
	scan,
} from './scan.js'
export {
	describeTable,
	getTableInfo,
	type ListTablesResult,
	listTables,
	type TableInfo,
} from './tables.js'
