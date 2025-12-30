import { Box, Text, useInput } from 'ink'
import { useEffect, useMemo, useState } from 'react'
import {
	type Column,
	ConfirmDialog,
	DataTable,
	Loading,
	MainPanel,
	QueryFilterSummary,
	QueryForm,
	type QueryFormOutput,
	ScanFilterForm,
} from '../components/index.js'
import type { FilterCondition } from '../schemas/query-params.js'
import { getErrorDisplayMessage } from '../services/dynamodb/errors.js'
import { useAppStore } from '../store/app-store.js'
import { useQuery } from '../store/use-query.js'
import { useScan } from '../store/use-scan.js'
import { useTables } from '../store/use-tables.js'
import { colors } from '../theme.js'
import type { TableViewState } from '../types/navigation.js'

export type TableViewProps = {
	state: TableViewState
	maxHeight?: number
}

type Mode = 'scan' | 'query' | 'query-form' | 'scan-filter-form'

export function TableView({ state, maxHeight = 20 }: TableViewProps) {
	const { tableName } = state
	// MainPanel overhead: border(2) + header(1) + sep(1) + metadata(1) + margin+sep(2) + footer(1) = 8
	// DataTable overhead: header(1) + sep(1) + scroll indicators(~1) = 3
	const tableMaxRows = Math.max(5, maxHeight - 11)
	const { navigate, goBack, focusedPanel, setInputMode } = useAppStore()
	const { fetchTableInfo, tableInfoCache } = useTables()
	const scan = useScan(tableName)
	const query = useQuery(tableName)

	const [mode, setMode] = useState<Mode>(state.mode)
	const initialIndex = state.selectedIndex ?? 0
	const [selectedIndex, setSelectedIndex] = useState(initialIndex)
	const [confirmClearFilters, setConfirmClearFilters] = useState(false)

	const tableInfo = tableInfoCache.get(tableName)
	const currentData = mode === 'query' ? query : scan
	const { items, isLoading, error, hasMore, scannedCount } = currentData
	const filterConditions = scan.filterConditions

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

	// Stable row key using primary key values (prevents React reconciliation issues)
	const getRowKey = useMemo(() => {
		if (!tableInfo) return undefined
		const { partitionKey, sortKey } = tableInfo
		return (row: Record<string, unknown>) => {
			const pk = String(row[partitionKey] ?? '')
			const sk = sortKey ? String(row[sortKey] ?? '') : ''
			return `${pk}|${sk}`
		}
	}, [tableInfo])

	// Extract unique attribute names from items for autocomplete
	const availableAttributes = useMemo(() => {
		const keys = new Set<string>()
		for (const item of items) {
			for (const key of Object.keys(item)) {
				keys.add(key)
			}
		}
		return Array.from(keys).sort()
	}, [items])

	useEffect(() => {
		fetchTableInfo(tableName)
	}, [tableName, fetchTableInfo])

	// Only run initial scan if not already initialized (prevents re-fetch on back-nav)
	useEffect(() => {
		if (mode === 'scan' && !scan.initialized && !scan.isLoading) {
			scan.refresh()
		}
	}, [mode, scan.initialized, scan.isLoading, scan.refresh])

	const isMainFocused = focusedPanel === 'main'

	const handleConfirmClear = () => {
		scan.clearFilters()
		setConfirmClearFilters(false)
	}

	const handleCancelClear = () => {
		setConfirmClearFilters(false)
	}

	useInput(
		(input, key) => {
			// Dialog handles its own input via ConfirmInput
			if (confirmClearFilters) return

			if (key.escape) {
				goBack()
			} else if (input === 's') {
				if (mode !== 'scan') {
					setMode('scan')
					setInputMode('normal')
					setSelectedIndex(0)
				} else if (filterConditions.length > 0) {
					// Show confirmation before clearing filters
					setConfirmClearFilters(true)
				} else {
					// No filters, just refresh
					scan.refresh()
				}
			} else if (input === 'f' && mode === 'scan') {
				setMode('scan-filter-form')
				setInputMode('scan-filter')
			} else if (input === 'q') {
				setMode('query-form')
				setInputMode('query-form')
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
				const navMode: 'scan' | 'query' = mode === 'query' ? 'query' : 'scan'
				navigate(
					{ view: 'item', tableName, item: items[selectedIndex] },
					{ view: 'table', tableName, mode: navMode, selectedIndex },
				)
			}
		},
		{ isActive: isMainFocused && (mode === 'scan' || mode === 'query') },
	)

	const handleQuerySubmit = (params: QueryFormOutput) => {
		setMode('query')
		setInputMode('normal')
		setSelectedIndex(0)
		query.executeQuery(params, true)
	}

	const handleQueryCancel = () => {
		setMode(state.mode === 'query' ? 'query' : 'scan')
		setInputMode('normal')
	}

	const handleScanFilterSubmit = (conditions: FilterCondition[]) => {
		setMode('scan')
		setInputMode('normal')
		setSelectedIndex(0)
		scan.refresh(conditions)
	}

	const handleScanFilterCancel = () => {
		setMode('scan')
		setInputMode('normal')
	}

	// Determine display mode for metadata
	const displayMode = mode === 'query-form' || mode === 'query' ? 'query' : 'scan'

	// Metadata bar content - show even without tableInfo, just with less detail
	const metadataContent = (
		<Box gap={1}>
			{tableInfo ? (
				<>
					<Text color={colors.textSecondary}>PK:</Text>
					<Text color={colors.dataKey}>{tableInfo.partitionKey}</Text>
					{tableInfo.sortKey && (
						<>
							<Text color={colors.border}>│</Text>
							<Text color={colors.textSecondary}>SK:</Text>
							<Text color={colors.dataKey}>{tableInfo.sortKey}</Text>
						</>
					)}
					<Text color={colors.border}>│</Text>
					<Text color={colors.textSecondary}>
						{tableInfo.itemCount?.toLocaleString() ?? '?'} items
					</Text>
				</>
			) : (
				<Text color={colors.textMuted}>Loading schema...</Text>
			)}
			<Text color={colors.border}>│</Text>
			<Text color={displayMode === 'scan' ? colors.active : colors.focus}>{displayMode}</Text>
		</Box>
	)

	// Query/Filter summary (only show when not in form mode and have active params)
	const queryFilterContent =
		mode === 'scan' || mode === 'query' ? (
			<QueryFilterSummary
				mode={displayMode}
				queryParams={mode === 'query' ? query.queryParams : null}
				filterConditions={mode === 'scan' ? filterConditions : []}
			/>
		) : null

	// Check if filters are active
	const hasActiveFilters = filterConditions.length > 0

	// Footer content (scanned count + more indicator + clear hint)
	const footerContent =
		(mode === 'scan' || mode === 'query') && items.length > 0 ? (
			<Box gap={2}>
				{isLoading && <Text color={colors.textMuted}>Loading...</Text>}
				{scannedCount > 0 && (
					<Text color={colors.textSecondary}>Scanned: {scannedCount.toLocaleString()}</Text>
				)}
				{hasMore && (
					<Text color={colors.textMuted}>
						<Text color={colors.border}>│</Text> <Text color={colors.brand}>▼</Text> more available
					</Text>
				)}
				{hasActiveFilters && mode === 'scan' && !confirmClearFilters && (
					<Text color={colors.textMuted}>
						<Text color={colors.border}>│</Text> <Text color={colors.focus}>s</Text> Clear filters
					</Text>
				)}
			</Box>
		) : null

	// Form views - render directly in MainPanel (no extra Panel wrapper)
	if (mode === 'query-form' && tableInfo) {
		return (
			<MainPanel
				title={`${tableName} › Query`}
				panelNumber={0}
				focused={isMainFocused}
				metadata={metadataContent}
			>
				<QueryForm
					partitionKeyName={tableInfo.partitionKey}
					sortKeyName={tableInfo.sortKey}
					onSubmit={handleQuerySubmit}
					onCancel={handleQueryCancel}
				/>
			</MainPanel>
		)
	}

	if (mode === 'scan-filter-form') {
		return (
			<MainPanel
				title={`${tableName} › Filter`}
				panelNumber={0}
				focused={isMainFocused}
				metadata={metadataContent}
			>
				<ScanFilterForm
					initialConditions={filterConditions}
					onSubmit={handleScanFilterSubmit}
					onCancel={handleScanFilterCancel}
					availableAttributes={availableAttributes}
				/>
			</MainPanel>
		)
	}

	// Results view
	return (
		<MainPanel
			title={tableName}
			panelNumber={0}
			focused={isMainFocused}
			metadata={metadataContent}
			queryFilter={queryFilterContent}
			footer={footerContent}
		>
			{confirmClearFilters ? (
				<ConfirmDialog
					message="Clear all filters and rescan?"
					visible={confirmClearFilters}
					onConfirm={handleConfirmClear}
					onCancel={handleCancelClear}
				/>
			) : isLoading && items.length === 0 ? (
				<Loading message={mode === 'scan' ? 'Scanning...' : 'Querying...'} />
			) : !tableInfo && items.length > 0 ? (
				<Loading message="Loading schema..." />
			) : error ? (
				<Text color={colors.error}>{getErrorDisplayMessage(error)}</Text>
			) : items.length === 0 ? (
				<Text color={colors.textMuted}>No items found</Text>
			) : (
				<DataTable
					data={items}
					columns={columns}
					selectedIndex={selectedIndex}
					onSelect={setSelectedIndex}
					maxHeight={tableMaxRows}
					focused={isMainFocused}
					getRowKey={getRowKey}
					onEnter={(row) => {
						navigate({ view: 'item', tableName, item: row }, state)
					}}
				/>
			)}
		</MainPanel>
	)
}
