import { Box, Text, useInput } from 'ink'
import { useCallback, useMemo, useState } from 'react'
import { colors, symbols } from '../../theme.js'

export type Column<T> = {
	key: keyof T | string
	header: string
	width?: number
	align?: 'left' | 'right'
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
	/** Function to generate stable key for each row. Defaults to using row index. */
	getRowKey?: (row: T, index: number) => string
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
	return path.split('.').reduce<unknown>((acc, part) => {
		if (acc && typeof acc === 'object') {
			return (acc as Record<string, unknown>)[part]
		}
		return undefined
	}, obj)
}

type FormattedValue = {
	text: string
	color?: string
	isNumber?: boolean
}

function formatValue(value: unknown): FormattedValue {
	if (value === null) {
		return { text: symbols.null, color: colors.textMuted }
	}
	if (value === undefined) {
		return { text: '', color: colors.textMuted }
	}

	// Binary data (Buffer or Uint8Array)
	if (
		value instanceof Uint8Array ||
		(value && typeof value === 'object' && 'type' in value && value.type === 'Buffer')
	) {
		const len =
			value instanceof Uint8Array
				? value.length
				: ((value as { data?: unknown[] }).data?.length ?? 0)
		return { text: `<binary ${len}b>`, color: colors.textMuted }
	}

	// Sets (DynamoDB SS, NS, BS)
	if (Array.isArray(value)) {
		if (value.length <= 3) {
			return { text: `{${value.join(', ')}}`, color: colors.dataValue }
		}
		return { text: `{${value.length} items}`, color: colors.textSecondary }
	}

	// Objects/Maps
	if (typeof value === 'object') {
		const keys = Object.keys(value)
		return { text: `{${keys.length} keys}`, color: colors.textSecondary }
	}

	// Numbers
	if (typeof value === 'number') {
		return { text: String(value), color: colors.dataValue, isNumber: true }
	}

	// Booleans
	if (typeof value === 'boolean') {
		return { text: value ? 'true' : 'false', color: colors.focus }
	}

	return { text: String(value) }
}

function formatValueString(value: unknown): string {
	return formatValue(value).text
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
			const formatted = col.render ? col.render(value, row) : formatValueString(value)
			return Math.max(max, formatted.length)
		}, 0)
		return Math.min(col.width ?? Math.max(headerLen, maxDataLen), maxWidth)
	})
}

function detectAlignment<T extends Record<string, unknown>>(
	data: T[],
	column: Column<T>,
): 'left' | 'right' {
	if (column.align) return column.align
	// Check first few values to detect if column is numeric
	const sample = data.slice(0, 5)
	const numericCount = sample.filter((row) => {
		const value = getNestedValue(row, column.key as string)
		return typeof value === 'number'
	}).length
	return numericCount > sample.length / 2 ? 'right' : 'left'
}

export function DataTable<T extends Record<string, unknown>>({
	data,
	columns: propColumns,
	selectedIndex: controlledIndex,
	onSelect,
	onEnter,
	maxHeight = 20,
	focused = true,
	getRowKey,
}: DataTableProps<T>) {
	const [internalIndex, setInternalIndex] = useState(0)
	const selectedIndex = controlledIndex ?? internalIndex

	const columns: Column<T>[] = useMemo(() => {
		if (propColumns) return propColumns
		if (data.length === 0) return []
		const keys = Object.keys(data[0] ?? {})
		return keys.slice(0, 5).map((key) => ({ key, header: key }))
	}, [propColumns, data])

	const columnWidths = useMemo(() => calculateColumnWidths(data, columns), [data, columns])

	const columnAlignments = useMemo(
		() => columns.map((col) => detectAlignment(data, col)),
		[data, columns],
	)

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
				<Text color={colors.textMuted}>No data</Text>
			</Box>
		)
	}

	const visibleStart = Math.max(0, selectedIndex - Math.floor(maxHeight / 2))
	const visibleEnd = Math.min(data.length, visibleStart + maxHeight)
	const visibleData = data.slice(visibleStart, visibleEnd)

	const hasScrollUp = visibleStart > 0
	const hasScrollDown = visibleEnd < data.length

	const totalWidth = columnWidths.reduce((a, b) => a + b + 1, 0) + 2 // +2 for selection indicator

	return (
		<Box flexDirection="column">
			{/* Scroll up indicator */}
			{hasScrollUp && (
				<Box justifyContent="flex-end" width={totalWidth}>
					<Text color={colors.textMuted}>{symbols.scrollUp}</Text>
				</Box>
			)}

			{/* Header - always left-aligned */}
			<Box>
				<Box width={2} />
				{columns.map((col, i) => {
					const width = columnWidths[i] ?? 10
					const header = col.header.slice(0, width).padEnd(width)
					return (
						<Box key={col.key as string} width={width} marginRight={1}>
							<Text bold color={colors.text}>
								{header}
							</Text>
						</Box>
					)
				})}
			</Box>

			{/* Separator */}
			<Box>
				<Box width={2} />
				<Text color={colors.border}>{symbols.headerSeparator.repeat(totalWidth - 2)}</Text>
			</Box>

			{/* Rows */}
			{visibleData.map((row, i) => {
				const actualIndex = visibleStart + i
				const isSelected = actualIndex === selectedIndex && focused
				const rowKey = getRowKey ? getRowKey(row, actualIndex) : `row-${actualIndex}`
				return (
					<Box key={rowKey}>
						{/* Selection indicator */}
						<Text color={isSelected ? colors.focus : colors.textMuted} inverse={isSelected}>
							{isSelected ? symbols.selected : ' '}{' '}
						</Text>
						{columns.map((col, colIdx) => {
							const value = getNestedValue(row, col.key as string)
							const formatted: FormattedValue = col.render
								? { text: col.render(value, row) }
								: formatValue(value)
							const width = columnWidths[colIdx] ?? 10
							const truncated = formatted.text.slice(0, width)
							const align = columnAlignments[colIdx]
							const padded = align === 'right' ? truncated.padStart(width) : truncated.padEnd(width)
							return (
								<Box key={col.key as string} width={width} marginRight={1}>
									<Text color={isSelected ? colors.focus : formatted.color} inverse={isSelected}>
										{padded}
									</Text>
								</Box>
							)
						})}
					</Box>
				)
			})}

			{/* Scroll down indicator */}
			{hasScrollDown && (
				<Box justifyContent="flex-end" width={totalWidth}>
					<Text color={colors.textMuted}>{symbols.scrollDown}</Text>
				</Box>
			)}
		</Box>
	)
}
