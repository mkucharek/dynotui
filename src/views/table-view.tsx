import { Box, Text, useInput } from 'ink'
import { useEffect, useMemo, useState } from 'react'
import {
	type Column,
	DataTable,
	Footer,
	Header,
	Loading,
	Pagination,
	Panel,
	QueryForm,
	ScanFilterForm,
} from '../components/index.js'
import type { FilterCondition, QueryParams } from '../schemas/query-params.js'
import { getErrorDisplayMessage } from '../services/dynamodb/errors.js'
import { useAppStore } from '../store/app-store.js'
import { useQuery } from '../store/use-query.js'
import { useScan } from '../store/use-scan.js'
import { useTables } from '../store/use-tables.js'
import type { TableViewState } from '../types/navigation.js'

export type TableViewProps = {
	state: TableViewState
}

type Mode = 'scan' | 'query' | 'query-form' | 'scan-filter-form'

export function TableView({ state }: TableViewProps) {
	const { tableName } = state
	const { navigate, goBack } = useAppStore()
	const { fetchTableInfo, tableInfoCache } = useTables()
	const scan = useScan(tableName)
	const query = useQuery(tableName)

	const [mode, setMode] = useState<Mode>(state.mode)
	const initialIndex = state.selectedIndex ?? 0
	const [selectedIndex, setSelectedIndex] = useState(initialIndex)

	const tableInfo = tableInfoCache.get(tableName)
	const currentData = mode === 'query' ? query : scan
	const { items, isLoading, error, hasMore, scannedCount, filterConditions } =
		currentData as typeof scan

	// Build columns with PK and SK first
	const columns = useMemo(() => {
		if (!tableInfo || items.length === 0) return undefined

		const cols: Column<Record<string, unknown>>[] = []
		const usedKeys = new Set<string>()

		// Add PK first
		cols.push({ key: tableInfo.partitionKey, header: tableInfo.partitionKey })
		usedKeys.add(tableInfo.partitionKey)

		// Add SK second if exists
		if (tableInfo.sortKey) {
			cols.push({ key: tableInfo.sortKey, header: tableInfo.sortKey })
			usedKeys.add(tableInfo.sortKey)
		}

		// Add other keys from first item (up to 5 total columns)
		const firstItem = items[0]
		if (firstItem) {
			for (const key of Object.keys(firstItem)) {
				if (!usedKeys.has(key) && cols.length < 5) {
					cols.push({ key, header: key })
					usedKeys.add(key)
				}
			}
		}

		return cols
	}, [tableInfo, items])

	useEffect(() => {
		fetchTableInfo(tableName)
	}, [tableName, fetchTableInfo])

	// Only run initial scan if not already initialized (prevents re-fetch on back-nav)
	useEffect(() => {
		if (mode === 'scan' && !scan.initialized && !scan.isLoading) {
			scan.refresh()
		}
	}, [mode, scan.initialized, scan.isLoading, scan.refresh])

	useInput(
		(input, key) => {
			if (key.escape) {
				goBack()
			} else if (input === 'j' || key.downArrow) {
				setSelectedIndex((i) => Math.min(i + 1, items.length - 1))
			} else if (input === 'k' || key.upArrow) {
				setSelectedIndex((i) => Math.max(i - 1, 0))
			} else if (input === 's') {
				if (mode !== 'scan') {
					setMode('scan')
					setSelectedIndex(0)
				} else {
					// Clear filters and refresh when already in scan mode
					scan.clearFilters()
				}
			} else if (input === 'f' && mode === 'scan') {
				setMode('scan-filter-form')
			} else if (input === 'q') {
				setMode('query-form')
			} else if (input === 'n' && hasMore && !isLoading) {
				if (mode === 'scan') {
					scan.fetchNextPage()
				} else {
					query.fetchNextPage()
				}
			} else if (input === 'r') {
				if (mode === 'scan') {
					scan.refresh()
				} else if (mode === 'query' && query.queryParams) {
					query.executeQuery(query.queryParams, true)
				}
			} else if (key.return && items[selectedIndex]) {
				navigate(
					{ view: 'item', tableName, item: items[selectedIndex] },
					{ view: 'table', tableName, mode, selectedIndex },
				)
			}
		},
		{ isActive: mode === 'scan' || mode === 'query' },
	)

	const handleQuerySubmit = (params: QueryParams) => {
		setMode('query')
		setSelectedIndex(0)
		query.executeQuery(params, true)
	}

	const handleQueryCancel = () => {
		setMode(state.mode === 'query' ? 'query' : 'scan')
	}

	const handleScanFilterSubmit = (conditions: FilterCondition[]) => {
		setMode('scan')
		setSelectedIndex(0)
		scan.refresh(conditions)
	}

	const handleScanFilterCancel = () => {
		setMode('scan')
	}

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Header />

			<Box flexGrow={1} padding={1} flexDirection="column" gap={1}>
				{/* Table info bar */}
				<Box gap={2}>
					<Text bold color="cyan">
						{tableName}
					</Text>
					{tableInfo && (
						<>
							<Text dimColor>
								PK: <Text color="yellow">{tableInfo.partitionKey}</Text>
							</Text>
							{tableInfo.sortKey && (
								<Text dimColor>
									SK: <Text color="yellow">{tableInfo.sortKey}</Text>
								</Text>
							)}
							<Text dimColor>
								Items: <Text color="yellow">{tableInfo.itemCount?.toLocaleString()}</Text>
							</Text>
						</>
					)}
					<Text dimColor>
						Mode:{' '}
						<Text color={mode === 'scan' || mode === 'scan-filter-form' ? 'green' : 'blue'}>
							{mode === 'query-form' ? 'query' : mode === 'scan-filter-form' ? 'scan' : mode}
						</Text>
						{filterConditions.length > 0 && mode === 'scan' && (
							<Text color="yellow"> ({filterConditions.length} filters)</Text>
						)}
					</Text>
				</Box>

				{/* Query form */}
				{mode === 'query-form' && tableInfo && (
					<Panel title="Query">
						<QueryForm
							partitionKeyName={tableInfo.partitionKey}
							sortKeyName={tableInfo.sortKey}
							onSubmit={handleQuerySubmit}
							onCancel={handleQueryCancel}
						/>
					</Panel>
				)}

				{/* Scan filter form */}
				{mode === 'scan-filter-form' && (
					<Panel title="Scan Filter">
						<ScanFilterForm
							initialConditions={filterConditions}
							onSubmit={handleScanFilterSubmit}
							onCancel={handleScanFilterCancel}
						/>
					</Panel>
				)}

				{/* Results panel */}
				{(mode === 'scan' || mode === 'query') && (
					<Panel title="Results" focused flexGrow={1}>
						{isLoading && items.length === 0 ? (
							<Loading message={mode === 'scan' ? 'Scanning...' : 'Querying...'} />
						) : error ? (
							<Text color="red">{getErrorDisplayMessage(error)}</Text>
						) : items.length === 0 ? (
							<Text dimColor>No items found</Text>
						) : (
							<DataTable
								data={items}
								columns={columns}
								selectedIndex={selectedIndex}
								onSelect={setSelectedIndex}
								onEnter={(item) =>
									navigate(
										{ view: 'item', tableName, item },
										{ view: 'table', tableName, mode, selectedIndex },
									)
								}
								focused={false}
							/>
						)}
					</Panel>
				)}

				{/* Pagination */}
				{(mode === 'scan' || mode === 'query') && items.length > 0 && (
					<Pagination
						hasMore={hasMore}
						isLoading={isLoading}
						scannedCount={scannedCount}
						onNextPage={() => (mode === 'scan' ? scan.fetchNextPage() : query.fetchNextPage())}
						onRefresh={() =>
							mode === 'scan'
								? scan.refresh()
								: query.queryParams && query.executeQuery(query.queryParams, true)
						}
						focused={false}
					/>
				)}
			</Box>

			<Footer
				bindings={
					mode === 'scan'
						? [
								{ key: 'Enter', label: 'View' },
								{ key: 's', label: 'Scan' },
								{ key: 'f', label: 'Filter' },
								{ key: 'q', label: 'Query' },
								{ key: 'n', label: 'More' },
								{ key: 'r', label: 'Refresh' },
								{ key: 'Esc', label: 'Back' },
							]
						: [
								{ key: 'Enter', label: 'View' },
								{ key: 's', label: 'Scan' },
								{ key: 'q', label: 'Query' },
								{ key: 'n', label: 'More' },
								{ key: 'r', label: 'Refresh' },
								{ key: 'Esc', label: 'Back' },
							]
				}
			/>
		</Box>
	)
}
