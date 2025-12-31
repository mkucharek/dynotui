import { Box, Text, useInput } from 'ink'
import { useState } from 'react'
import type { IndexInfo } from '../../services/dynamodb/tables.js'
import { colors, symbols } from '../../theme.js'

export type IndexSelectorItem = {
	value: string // index name or '' for base table
	label: string
	type: 'base' | 'GSI' | 'LSI'
	pkName: string
	skName?: string
}

export type IndexSelectorProps = {
	items: IndexSelectorItem[]
	selectedValue: string
	onChange: (item: IndexSelectorItem) => void
	focused?: boolean
}

export function buildIndexItems(
	indexes: IndexInfo[],
	basePk: string,
	baseSk?: string,
): IndexSelectorItem[] {
	const baseItem: IndexSelectorItem = {
		value: '',
		label: 'Base Table',
		type: 'base',
		pkName: basePk,
		skName: baseSk,
	}

	const indexItems = indexes.map((idx) => ({
		value: idx.name,
		label: idx.name,
		type: idx.type,
		pkName: idx.partitionKey,
		skName: idx.sortKey,
	}))

	return [baseItem, ...indexItems]
}

function formatKeySchema(pk: string, sk?: string): string {
	if (sk) {
		return `${pk} + ${sk}`
	}
	return pk
}

export function IndexSelector({
	items,
	selectedValue,
	onChange,
	focused = true,
}: IndexSelectorProps) {
	const selectedIndex = items.findIndex((item) => item.value === selectedValue)
	const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0)

	useInput(
		(input, key) => {
			if (!focused) return

			if (key.return) {
				const item = items[highlightedIndex]
				if (item) onChange(item)
				return
			}

			if (input === 'j' || key.downArrow) {
				setHighlightedIndex((i) => Math.min(i + 1, items.length - 1))
			} else if (input === 'k' || key.upArrow) {
				setHighlightedIndex((i) => Math.max(i - 1, 0))
			}
		},
		{ isActive: focused },
	)

	return (
		<Box flexDirection="column">
			{items.map((item, i) => {
				const isHighlighted = i === highlightedIndex
				const isSelected = item.value === selectedValue
				const keySchema = formatKeySchema(item.pkName, item.skName)

				return (
					<Box key={item.value || '__base__'} gap={1}>
						<Text color={isHighlighted ? colors.focus : colors.textSecondary}>
							{isHighlighted ? symbols.selected : ' '}
						</Text>
						{item.type !== 'base' && (
							<Text color={isHighlighted ? colors.focus : colors.textMuted}>{item.type}:</Text>
						)}
						<Text color={isHighlighted ? colors.focus : colors.text} bold={isSelected}>
							{item.label}
						</Text>
						<Text color={colors.textMuted}>({keySchema})</Text>
					</Box>
				)
			})}
		</Box>
	)
}
