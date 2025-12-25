import { Box, Text, useInput } from 'ink'
import { useState } from 'react'

export type TableListProps = {
	tables: string[]
	selectedIndex?: number
	onSelect?: (index: number) => void
	onEnter?: (tableName: string) => void
	focused?: boolean
	maxHeight?: number
}

export function TableList({
	tables,
	selectedIndex: controlledIndex,
	onSelect,
	onEnter,
	focused = true,
	maxHeight = 15,
}: TableListProps) {
	const [internalIndex, setInternalIndex] = useState(0)
	const selectedIndex = controlledIndex ?? internalIndex

	const handleSelect = (index: number) => {
		if (onSelect) {
			onSelect(index)
		} else {
			setInternalIndex(index)
		}
	}

	useInput(
		(input, key) => {
			if (!focused || tables.length === 0) return

			if (input === 'j' || key.downArrow) {
				handleSelect(Math.min(selectedIndex + 1, tables.length - 1))
			} else if (input === 'k' || key.upArrow) {
				handleSelect(Math.max(selectedIndex - 1, 0))
			} else if (key.return && onEnter && tables[selectedIndex]) {
				onEnter(tables[selectedIndex])
			}
		},
		{ isActive: focused },
	)

	if (tables.length === 0) {
		return (
			<Box padding={1}>
				<Text dimColor>No tables found</Text>
			</Box>
		)
	}

	const visibleStart = Math.max(0, selectedIndex - Math.floor(maxHeight / 2))
	const visibleEnd = Math.min(tables.length, visibleStart + maxHeight)
	const visibleTables = tables.slice(visibleStart, visibleEnd)

	return (
		<Box flexDirection="column">
			{visibleTables.map((table, i) => {
				const actualIndex = visibleStart + i
				const isSelected = actualIndex === selectedIndex
				return (
					<Box key={table}>
						<Text
							backgroundColor={isSelected ? 'cyan' : undefined}
							color={isSelected ? 'black' : undefined}
						>
							{isSelected ? '> ' : '  '}
							{table}
						</Text>
					</Box>
				)
			})}

			{tables.length > maxHeight && (
				<Box marginTop={1}>
					<Text dimColor>
						{visibleStart + 1}-{visibleEnd} of {tables.length}
					</Text>
				</Box>
			)}
		</Box>
	)
}
