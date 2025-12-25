import { Box, Text, useInput } from 'ink'
import { useCallback, useMemo, useState } from 'react'

export type Column<T> = {
	key: keyof T | string
	header: string
	width?: number
	render?: (value: unknown, row: T) => string
}

export type DataTableProps<T extends Record<string, unknown>> = {
	data: T[]
	columns?: Column<T>[]
	selectedIndex?: number
	onSelect?: (index: number) => void
	onEnter?: (row: T, index: number) => void
	maxHeight?: number
	focused?: boolean
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
	return path.split('.').reduce<unknown>((acc, part) => {
		if (acc && typeof acc === 'object') {
			return (acc as Record<string, unknown>)[part]
		}
		return undefined
	}, obj)
}

function formatValue(value: unknown): string {
	if (value === null) return 'null'
	if (value === undefined) return ''
	if (typeof value === 'object') return JSON.stringify(value)
	return String(value)
}

function calculateColumnWidths<T extends Record<string, unknown>>(
	data: T[],
	columns: Column<T>[],
	maxWidth = 30,
): number[] {
	return columns.map((col) => {
		const headerLen = col.header.length
		const maxDataLen = data.reduce((max, row) => {
			const value = getNestedValue(row, col.key as string)
			const formatted = col.render ? col.render(value, row) : formatValue(value)
			return Math.max(max, formatted.length)
		}, 0)
		return Math.min(col.width ?? Math.max(headerLen, maxDataLen), maxWidth)
	})
}

export function DataTable<T extends Record<string, unknown>>({
	data,
	columns: propColumns,
	selectedIndex: controlledIndex,
	onSelect,
	onEnter,
	maxHeight = 20,
	focused = true,
}: DataTableProps<T>) {
	const [internalIndex, setInternalIndex] = useState(0)
	const selectedIndex = controlledIndex ?? internalIndex

	const columns = useMemo(() => {
		if (propColumns) return propColumns
		if (data.length === 0) return []
		const keys = Object.keys(data[0] ?? {})
		return keys.slice(0, 5).map((key) => ({ key, header: key }))
	}, [propColumns, data])

	const columnWidths = useMemo(() => calculateColumnWidths(data, columns), [data, columns])

	const handleSelect = useCallback(
		(index: number) => {
			if (onSelect) {
				onSelect(index)
			} else {
				setInternalIndex(index)
			}
		},
		[onSelect],
	)

	useInput(
		(input, key) => {
			if (!focused || data.length === 0) return

			if (input === 'j' || key.downArrow) {
				handleSelect(Math.min(selectedIndex + 1, data.length - 1))
			} else if (input === 'k' || key.upArrow) {
				handleSelect(Math.max(selectedIndex - 1, 0))
			} else if (key.return && onEnter && data[selectedIndex]) {
				onEnter(data[selectedIndex], selectedIndex)
			}
		},
		{ isActive: focused },
	)

	if (data.length === 0) {
		return (
			<Box padding={1}>
				<Text dimColor>No data</Text>
			</Box>
		)
	}

	const visibleStart = Math.max(0, selectedIndex - Math.floor(maxHeight / 2))
	const visibleEnd = Math.min(data.length, visibleStart + maxHeight)
	const visibleData = data.slice(visibleStart, visibleEnd)

	return (
		<Box flexDirection="column">
			{/* Header */}
			<Box>
				{columns.map((col, i) => (
					<Box key={col.key as string} width={columnWidths[i]} marginRight={1}>
						<Text bold color="cyan">
							{col.header.slice(0, columnWidths[i]).padEnd(columnWidths[i])}
						</Text>
					</Box>
				))}
			</Box>

			{/* Separator */}
			<Box>
				<Text dimColor>{'─'.repeat(columnWidths.reduce((a, b) => a + b + 1, 0))}</Text>
			</Box>

			{/* Rows */}
			{visibleData.map((row, i) => {
				const actualIndex = visibleStart + i
				const isSelected = actualIndex === selectedIndex
				return (
					<Box key={actualIndex}>
						{columns.map((col, colIdx) => {
							const value = getNestedValue(row, col.key as string)
							const formatted = col.render ? col.render(value, row) : formatValue(value)
							const truncated = formatted.slice(0, columnWidths[colIdx])
							return (
								<Box key={col.key as string} width={columnWidths[colIdx]} marginRight={1}>
									<Text
										backgroundColor={isSelected ? 'cyan' : undefined}
										color={isSelected ? 'black' : undefined}
									>
										{truncated.padEnd(columnWidths[colIdx])}
									</Text>
								</Box>
							)
						})}
					</Box>
				)
			})}

			{/* Scroll indicator */}
			{data.length > maxHeight && (
				<Box marginTop={1}>
					<Text dimColor>
						Showing {visibleStart + 1}-{visibleEnd} of {data.length}
					</Text>
				</Box>
			)}
		</Box>
	)
}
