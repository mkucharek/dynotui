import { Box, Text, useInput } from 'ink'
import { useState } from 'react'
import { useTerminal } from '../../contexts/terminal-context.js'
import { colors, symbols } from '../../theme.js'

export type SidebarItem = {
	id: string
	label: string
	secondary?: string
}

export type SidebarSectionProps = {
	title?: string
	items: SidebarItem[]
	activeId?: string
	selectedIndex?: number
	onSelect?: (index: number) => void
	onEnter?: (item: SidebarItem) => void
	focused?: boolean
	flexGrow?: number
	maxVisibleItems?: number
	error?: string
	isLoading?: boolean
}

export function SidebarSection({
	title,
	items,
	activeId,
	selectedIndex: controlledIndex,
	onSelect,
	onEnter,
	focused = false,
	flexGrow,
	maxVisibleItems,
	error,
	isLoading,
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

	const hasScrollUp = visibleStart > 0
	const hasScrollDown = visibleEnd < items.length

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

	const { sidebarWidth } = useTerminal()
	const titleColor = focused ? colors.focus : colors.textSecondary
	const separatorChar = symbols.sectionSeparator
	// Separator fills sidebar content width (sidebar - border(2) - padding(2) from parent panel)
	const separatorWidth = Math.max(10, sidebarWidth - 4)

	return (
		<Box flexDirection="column" flexGrow={flexGrow}>
			{/* Optional header with title */}
			{title && (
				<>
					<Box justifyContent="space-between">
						<Box gap={1}>
							<Text color={titleColor}>{symbols.expanded}</Text>
							<Text color={titleColor} bold={focused}>
								{title}
							</Text>
						</Box>
						<Box gap={1}>
							{items.length > 0 && <Text color={colors.textMuted}>{items.length}</Text>}
							{hasScrollUp && <Text color={colors.textMuted}>{symbols.scrollUp}</Text>}
						</Box>
					</Box>
					<Text color={focused ? colors.focus : colors.border}>
						{separatorChar.repeat(separatorWidth)}
					</Text>
				</>
			)}

			{/* Items list */}
			<Box flexDirection="column" flexGrow={1} overflowY="hidden">
				{error ? (
					<Text color={colors.error}>{error}</Text>
				) : isLoading && items.length === 0 ? (
					<Text color={colors.textMuted}>Loading...</Text>
				) : items.length === 0 ? (
					<Text color={colors.textMuted}>No items</Text>
				) : (
					visibleItems.map((item, i) => {
						const actualIndex = visibleStart + i
						const isSelected = actualIndex === selectedIndex && focused
						const isActive = item.id === activeId

						return (
							<Box key={item.id} justifyContent="space-between">
								<Box>
									<Text color={isSelected ? colors.focus : colors.textMuted}>
										{isSelected ? symbols.selected : ' '}{' '}
									</Text>
									<Text color={isSelected ? colors.focus : colors.text} bold={isSelected}>
										{item.label}
									</Text>
									{item.secondary && <Text color={colors.textMuted}> {item.secondary}</Text>}
								</Box>
								{isActive && <Text color={colors.active}>{symbols.active}</Text>}
							</Box>
						)
					})
				)}
			</Box>

			{/* Scroll down indicator */}
			{hasScrollDown && (
				<Box justifyContent="flex-end">
					<Text color={colors.textMuted}>{symbols.scrollDown}</Text>
				</Box>
			)}
		</Box>
	)
}
