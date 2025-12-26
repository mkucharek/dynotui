import { Box, Text, useInput } from 'ink'
import { useState } from 'react'

export type SelectorItem = {
	value: string
	label: string
	description?: string
}

export type InlineSelectorProps = {
	items: SelectorItem[]
	initialIndex?: number
	onSelect: (value: string) => void
	onCancel: () => void
	focused?: boolean
	title: string
}

export function InlineSelector({
	items,
	initialIndex = 0,
	onSelect,
	onCancel,
	focused = true,
	title,
}: InlineSelectorProps) {
	const [selectedIndex, setSelectedIndex] = useState(initialIndex)

	useInput(
		(input, key) => {
			if (!focused) return

			if (key.escape) {
				onCancel()
				return
			}

			if (key.return && items[selectedIndex]) {
				onSelect(items[selectedIndex].value)
				return
			}

			if (input === 'j' || key.downArrow) {
				setSelectedIndex((i) => Math.min(i + 1, items.length - 1))
			} else if (input === 'k' || key.upArrow) {
				setSelectedIndex((i) => Math.max(i - 1, 0))
			}
		},
		{ isActive: focused },
	)

	const maxVisible = 15
	const halfVisible = Math.floor(maxVisible / 2)
	let startIndex = 0

	if (items.length > maxVisible) {
		startIndex = Math.max(0, selectedIndex - halfVisible)
		startIndex = Math.min(startIndex, items.length - maxVisible)
	}

	const visibleItems = items.slice(startIndex, startIndex + maxVisible)

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="cyan">
					{title}
				</Text>
			</Box>

			{visibleItems.map((item, i) => {
				const actualIndex = startIndex + i
				const isSelected = actualIndex === selectedIndex

				return (
					<Box key={item.value}>
						<Text color={isSelected ? 'cyan' : undefined}>
							{isSelected ? '> ' : '  '}
							{item.label}
						</Text>
						{item.description && (
							<Text dimColor> ({item.description})</Text>
						)}
					</Box>
				)
			})}

			{items.length > maxVisible && (
				<Box marginTop={1}>
					<Text dimColor>
						{startIndex + 1}-{Math.min(startIndex + maxVisible, items.length)} of {items.length}
					</Text>
				</Box>
			)}
		</Box>
	)
}
