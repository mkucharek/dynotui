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
	type QueryFormInitialValues,
	type QueryFormOutput,
	ScanFilterForm,
} from '../components/index.js'
import { TERMINAL } from '../constants/terminal.js'
import { useTerminal } from '../contexts/terminal-context.js'
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

type Mode = 'scan' | 'query' | 'query-form' | 'scan-filter-form' | 'query-filter-form'

export function TableView({ state, maxHeight = 20 }: TableViewProps) {
	const { tableName } = state
	const { contentHeight, mainWidth } = useTerminal()
	// Use context contentHeight if no explicit maxHeight, with overhead subtraction
	const effectiveMaxHeight = maxHeight === 20 ? contentHeight : maxHeight
	const tableMaxRows = Math.max(
		5,
		effectiveMaxHeight - TERMINAL.MAIN_PANEL_OVERHEAD - TERMINAL.DATA_TABLE_OVERHEAD,
	)
	// Available width for DataTable: mainWidth minus panel padding/border
	const tableAvailableWidth = mainWidth - 4
	const { navigate, goBack, focusedPanel, setInputMode } = useAppStore()
	const { fetchTableInfo, tableInfoCache } = useTables()
	const scan = useScan(tableName)
	const query = useQuery(tableName)

	const [mode, setMode] = useState<Mode>(state.mode)
	// Track the data mode (scan/query) we were in before opening form
	const [lastDataMode, setLastDataMode] = useState<'scan' | 'query'>(
		state.mode === 'query' ? 'query' : 'scan',
	)
	const initialIndex = state.selectedIndex ?? 0
	const [selectedIndex, setSelectedIndex] = useState(initialIndex)
	const [confirmClearFilters, setConfirmClearFilters] = useState(false)
	const [confirmSwitchToScan, setConfirmSwitchToScan] = useState(false)

	const tableInfo = tableInfoCache.get(tableName)
	// Use lastDataMode to get correct data source even when in form modes
	const currentData = lastDataMode === 'query' ? query : scan
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
		if (!tableInfo) {
			fetchTableInfo(tableName)
		}
	}, [tableName, tableInfo, fetchTableInfo])

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

	const handleConfirmSwitchToScan = () => {
		setMode('scan')
		setLastDataMode('scan')
		setSelectedIndex(0)
		setConfirmSwitchToScan(false)
	}

	const handleCancelSwitchToScan = () => {
		setConfirmSwitchToScan(false)
	}

	useInput(
		(input, key) => {
			// Dialog handles its own input via ConfirmInput
			if (confirmClearFilters || confirmSwitchToScan) return

			if (key.escape) {
				goBack()
			} else if (input === 's') {
				if (mode === 'query') {
					// Show confirmation before switching from query to scan
					setConfirmSwitchToScan(true)
				} else if (mode === 'scan' && filterConditions.length > 0) {
					// Show confirmation before clearing filters
					setConfirmClearFilters(true)
				} else if (mode === 'scan') {
					// No filters, just refresh
					scan.refresh()
				}
			} else if (input === 'f' && (mode === 'scan' || mode === 'query')) {
				if (mode === 'scan') {
					setMode('scan-filter-form')
				} else {
					setMode('query-filter-form')
				}
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
			} else if (input === 'c' && mode === 'query' && hasQueryFilters) {
				// Clear query filters (re-run query without filters)
				query.clearFilters()
				setSelectedIndex(0)
			} else if (input === 'c' && mode === 'scan' && hasScanFilters) {
				// Clear scan filters
				scan.clearFilters()
				setSelectedIndex(0)
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
		setLastDataMode('query')
		setInputMode('normal')
		setSelectedIndex(0)
		query.executeQuery(params, true)
	}

	const handleQueryCancel = () => {
		setMode(lastDataMode)
		setInputMode('normal')
	}

	const handleScanFilterSubmit = (conditions: FilterCondition[]) => {
		setMode('scan')
		setLastDataMode('scan')
		setInputMode('normal')
		setSelectedIndex(0)
		scan.refresh(conditions)
	}

	const handleScanFilterCancel = () => {
		setMode('scan')
		setInputMode('normal')
	}

	const handleQueryFilterSubmit = (conditions: FilterCondition[]) => {
		setMode('query')
		setInputMode('normal')
		setSelectedIndex(0)
		query.applyFilters(conditions)
	}

	const handleQueryFilterCancel = () => {
		setMode('query')
		setInputMode('normal')
	}

	// Determine display mode for metadata
	const displayMode =
		mode === 'query-form' || mode === 'query' || mode === 'query-filter-form' ? 'query' : 'scan'

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
					{tableInfo.indexes.length > 0 && (
						<>
							<Text color={colors.border}>│</Text>
							<Text color={colors.textMuted}>
								{tableInfo.indexes.length} index{tableInfo.indexes.length > 1 ? 'es' : ''}
							</Text>
						</>
					)}
				</>
			) : (
				<Text color={colors.textMuted}>Loading schema...</Text>
			)}
			<Text color={colors.border}>│</Text>
			<Text color={displayMode === 'scan' ? colors.active : colors.focus}>{displayMode}</Text>
		</Box>
	)

	// Query/Filter summary (only show when not in form mode and have active params)
	const queryFilterConditions = query.queryParams?.filterConditions ?? []
	const queryFilterContent =
		mode === 'scan' || mode === 'query' ? (
			<QueryFilterSummary
				mode={displayMode}
				queryParams={mode === 'query' ? query.queryParams : null}
				filterConditions={mode === 'scan' ? filterConditions : queryFilterConditions}
			/>
		) : null

	// Check if filters are active (scan filters or query filters)
	const hasScanFilters = filterConditions.length > 0
	const hasQueryFilters = queryFilterConditions.length > 0

	// Footer content (scanned count + more indicator + filter hints)
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
				{hasScanFilters && mode === 'scan' && !confirmClearFilters && (
					<Text color={colors.textMuted}>
						<Text color={colors.border}>│</Text> <Text color={colors.focus}>c</Text> Clear filters
					</Text>
				)}
				{hasQueryFilters && mode === 'query' && !confirmSwitchToScan && (
					<>
						<Text color={colors.textMuted}>
							<Text color={colors.border}>│</Text> <Text color={colors.focus}>f</Text> Edit filters
						</Text>
						<Text color={colors.textMuted}>
							<Text color={colors.border}>│</Text> <Text color={colors.focus}>c</Text> Clear filters
						</Text>
					</>
				)}
			</Box>
		) : null

	// Form views - render directly in MainPanel (no extra Panel wrapper)
	if (mode === 'query-form' && tableInfo) {
		// Only populate initial values when editing existing query (came from query mode)
		// When coming from scan mode, start fresh
		const queryInitialValues: QueryFormInitialValues | undefined =
			lastDataMode === 'query' && query.queryParams
				? {
						indexName: query.queryParams.indexName,
						partitionKey: query.queryParams.partitionKey,
						sortKey: query.queryParams.sortKey,
						filterConditions: query.queryParams.filterConditions,
					}
				: undefined

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
					indexes={tableInfo.indexes}
					onSubmit={handleQuerySubmit}
					onCancel={handleQueryCancel}
					initialValues={queryInitialValues}
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

	if (mode === 'query-filter-form') {
		return (
			<MainPanel
				title={`${tableName} › Query Filter`}
				panelNumber={0}
				focused={isMainFocused}
				metadata={metadataContent}
			>
				<ScanFilterForm
					initialConditions={query.queryParams?.filterConditions ?? []}
					onSubmit={handleQueryFilterSubmit}
					onCancel={handleQueryFilterCancel}
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
			) : confirmSwitchToScan ? (
				<ConfirmDialog
					message="Switch to scan mode? Query results will be lost."
					visible={confirmSwitchToScan}
					onConfirm={handleConfirmSwitchToScan}
					onCancel={handleCancelSwitchToScan}
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
					availableWidth={tableAvailableWidth}
					onEnter={(row) => {
						navigate({ view: 'item', tableName, item: row }, state)
					}}
				/>
			)}
		</MainPanel>
	)
}
