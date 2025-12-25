import { Box, Text, useInput } from 'ink'
import { useEffect, useState } from 'react'
import {
	DataTable,
	Footer,
	Header,
	Loading,
	Pagination,
	Panel,
	QueryForm,
} from '../components/index.js'
import type { QueryParams } from '../schemas/query-params.js'
import { useAppStore } from '../store/app-store.js'
import { useQuery } from '../store/use-query.js'
import { useScan } from '../store/use-scan.js'
import { useTables } from '../store/use-tables.js'
import type { TableViewState } from '../types/navigation.js'

export type TableViewProps = {
	state: TableViewState
}

type Mode = 'scan' | 'query' | 'query-form'

export function TableView({ state }: TableViewProps) {
	const { tableName } = state
	const { navigate, goBack } = useAppStore()
	const { fetchTableInfo, tableInfoCache } = useTables()
	const scan = useScan(tableName)
	const query = useQuery(tableName)

	const [mode, setMode] = useState<Mode>(state.mode)
	const [selectedIndex, setSelectedIndex] = useState(0)

	const tableInfo = tableInfoCache.get(tableName)
	const currentData = mode === 'query' ? query : scan
	const { items, isLoading, error, hasMore, scannedCount } = currentData

	useEffect(() => {
		fetchTableInfo(tableName)
	}, [tableName, fetchTableInfo])

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run only on mode change
	useEffect(() => {
		if (mode === 'scan') {
			scan.refresh()
		}
	}, [mode])

	useInput(
		(input, key) => {
			if (mode === 'query-form') return

			if (key.escape) {
				goBack()
			} else if (input === 's' && mode !== 'scan') {
				setMode('scan')
				setSelectedIndex(0)
			} else if (input === 'q' && mode !== 'query-form') {
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
				navigate({
					view: 'item',
					tableName,
					item: items[selectedIndex],
				})
			}
		},
		{ isActive: mode !== 'query-form' },
	)

	const handleQuerySubmit = (params: QueryParams) => {
		setMode('query')
		setSelectedIndex(0)
		query.executeQuery(params, true)
	}

	const handleQueryCancel = () => {
		setMode(state.mode === 'query' ? 'query' : 'scan')
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
						<Text color={mode === 'scan' ? 'green' : 'blue'}>
							{mode === 'query-form' ? 'query' : mode}
						</Text>
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

				{/* Results panel */}
				{mode !== 'query-form' && (
					<Panel title="Results" focused flexGrow={1}>
						{isLoading && items.length === 0 ? (
							<Loading message={mode === 'scan' ? 'Scanning...' : 'Querying...'} />
						) : error ? (
							<Text color="red">{error}</Text>
						) : items.length === 0 ? (
							<Text dimColor>No items found</Text>
						) : (
							<DataTable
								data={items}
								selectedIndex={selectedIndex}
								onSelect={setSelectedIndex}
								onEnter={(item) => navigate({ view: 'item', tableName, item })}
							/>
						)}
					</Panel>
				)}

				{/* Pagination */}
				{mode !== 'query-form' && items.length > 0 && (
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
					/>
				)}
			</Box>

			<Footer
				bindings={[
					{ key: 'Enter', label: 'View' },
					{ key: 's', label: 'Scan' },
					{ key: 'q', label: 'Query' },
					{ key: 'n', label: 'More' },
					{ key: 'r', label: 'Refresh' },
					{ key: 'Esc', label: 'Back' },
				]}
			/>
		</Box>
	)
}
