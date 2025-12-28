import { Box, Text, useInput } from 'ink'
import { useState } from 'react'

export type SidebarItem = {
	id: string
	label: string
	secondary?: string
}

export type SidebarSectionProps = {
	shortcut: string
	title: string
	items: SidebarItem[]
	activeId?: string
	selectedIndex?: number
	onSelect?: (index: number) => void
	onEnter?: (item: SidebarItem) => void
	focused?: boolean
	flexGrow?: number
	maxVisibleItems?: number
}

export function SidebarSection({
	shortcut,
	title,
	items,
	activeId,
	selectedIndex: controlledIndex,
	onSelect,
	onEnter,
	focused = false,
	flexGrow,
	maxVisibleItems,
}: SidebarSectionProps) {
	const [internalIndex, setInternalIndex] = useState(0)
	const selectedIndex = controlledIndex ?? internalIndex

	const visibleCount = maxVisibleItems ?? items.length
	const halfVisible = Math.floor(visibleCount / 2)
	const visibleStart = Math.max(
		0,
		Math.min(selectedIndex - halfVisible, items.length - visibleCount),
	)
	const visibleEnd = Math.min(items.length, visibleStart + visibleCount)
	const visibleItems = items.slice(visibleStart, visibleEnd)

	const handleSelect = (index: number) => {
		if (onSelect) {
			onSelect(index)
		} else {
			setInternalIndex(index)
		}
	}

	useInput(
		(input, key) => {
			if (!focused || items.length === 0) return

			if (input === 'j' || key.downArrow) {
				handleSelect(Math.min(selectedIndex + 1, items.length - 1))
			} else if (input === 'k' || key.upArrow) {
				handleSelect(Math.max(selectedIndex - 1, 0))
			} else if (key.return && onEnter && items[selectedIndex]) {
				onEnter(items[selectedIndex])
			}
		},
		{ isActive: focused },
	)

	return (
		<Box flexDirection="column" flexGrow={flexGrow} marginBottom={1}>
			<Box>
				<Text color={focused ? 'cyan' : undefined} bold>
					[{shortcut}] {title}
				</Text>
				{items.length > 0 && <Text dimColor> ({items.length})</Text>}
			</Box>
			<Text color={focused ? 'cyan' : 'gray'}>{'─'.repeat(24)}</Text>
			<Box flexDirection="column" flexGrow={1} overflowY="hidden">
				{items.length === 0 ? (
					<Text dimColor>No items</Text>
				) : (
					visibleItems.map((item, i) => {
						const actualIndex = visibleStart + i
						const isSelected = actualIndex === selectedIndex && focused
						const isActive = item.id === activeId

						return (
							<Box key={item.id}>
								<Text color={isSelected ? 'cyan' : undefined}>{isSelected ? '>' : ' '} </Text>
								<Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
									{item.label}
								</Text>
								{item.secondary && <Text dimColor> {item.secondary}</Text>}
								<Text color="green">{isActive ? ' ◄' : ''}</Text>
							</Box>
						)
					})
				)}
			</Box>
		</Box>
	)
}
