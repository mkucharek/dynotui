import { Box, Text, useInput } from 'ink'
import { useEffect, useMemo, useState } from 'react'
import { useTerminal } from '../../contexts/terminal-context.js'
import { colors, symbols } from '../../theme.js'

/** Truncate text to fit within maxWidth, adding ellipsis if needed */
function truncateText(text: string, maxWidth: number): string {
	if (text.length <= maxWidth) return text
	if (maxWidth <= 1) return '…'
	return text.slice(0, maxWidth - 1) + '…'
}

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
	// Initialize internal index from activeId (for uncontrolled mode)
	const [internalIndex, setInternalIndex] = useState(() => {
		const idx = items.findIndex((i) => i.id === activeId)
		return idx >= 0 ? idx : 0
	})
	const selectedIndex = controlledIndex ?? internalIndex

	// Reserve 1 row for scroll indicator when we have more items than can fit
	const maxVisible = maxVisibleItems ?? items.length
	const needsScrolling = items.length > maxVisible
	const visibleCount = needsScrolling ? Math.max(1, maxVisible - 1) : maxVisible

	// Initialize scroll offset to show selected item (center it initially)
	const [scrollOffset, setScrollOffset] = useState(() => {
		if (items.length <= visibleCount) return 0
		const initialIndex = controlledIndex ?? 0
		const halfVisible = Math.floor(visibleCount / 2)
		return Math.max(0, Math.min(initialIndex - halfVisible, items.length - visibleCount))
	})

	// Edge-based scrolling: only scroll when selection goes out of view
	useEffect(() => {
		setScrollOffset((prev) => {
			// Clamp selection to valid range
			const clampedIndex = Math.max(0, Math.min(selectedIndex, items.length - 1))

			// If selection is above viewport, scroll up to show it at top
			if (clampedIndex < prev) {
				return clampedIndex
			}
			// If selection is below viewport, scroll down to show it at bottom
			if (clampedIndex >= prev + visibleCount) {
				return clampedIndex - visibleCount + 1
			}
			// Selection is visible - clamp offset if list shrunk but don't scroll otherwise
			const maxOffset = Math.max(0, items.length - visibleCount)
			return Math.min(prev, maxOffset)
		})
	}, [selectedIndex, visibleCount, items.length])

	const visibleStart = scrollOffset
	const visibleEnd = Math.min(items.length, scrollOffset + visibleCount)
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
	// Available width for item content: sidebar - border(2) - paddingX(2) - selector(2) - active indicator(2)
	const itemContentWidth = Math.max(8, sidebarWidth - 8)

	// Pre-compute truncated items to prevent line wrapping
	const truncatedItems = useMemo(() => {
		return visibleItems.map((item) => {
			const labelWidth = item.label.length
			const secondaryWidth = item.secondary ? item.secondary.length + 1 : 0 // +1 for space
			const totalWidth = labelWidth + secondaryWidth

			if (totalWidth <= itemContentWidth) {
				return { label: item.label, secondary: item.secondary }
			}

			// Truncate secondary first, then label if needed
			if (item.secondary) {
				const availableForSecondary = itemContentWidth - labelWidth - 1 // -1 for space
				if (availableForSecondary >= 3) {
					// Room for truncated secondary
					return {
						label: item.label,
						secondary: truncateText(item.secondary, availableForSecondary),
					}
				}
				// No room for secondary, truncate label only
				return { label: truncateText(item.label, itemContentWidth), secondary: undefined }
			}

			// No secondary, just truncate label
			return { label: truncateText(item.label, itemContentWidth), secondary: undefined }
		})
	}, [visibleItems, itemContentWidth])

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
						const truncated = truncatedItems[i]

						return (
							<Box key={item.id} justifyContent="space-between">
								<Box>
									<Text color={isSelected ? colors.focus : colors.textMuted}>
										{isSelected ? symbols.selected : ' '}{' '}
									</Text>
									<Text color={isSelected ? colors.focus : colors.text} bold={isSelected}>
										{truncated.label}
									</Text>
									{truncated.secondary && (
										<Text color={colors.textMuted}> {truncated.secondary}</Text>
									)}
								</Box>
								{isActive && <Text color={colors.active}>{symbols.active}</Text>}
							</Box>
						)
					})
				)}
			</Box>

			{/* Scroll indicators (combined on one line) */}
			{(hasScrollUp || hasScrollDown) && (
				<Box justifyContent="space-between">
					<Text color={colors.textMuted}>{hasScrollUp ? symbols.scrollUp : ' '}</Text>
					<Text color={colors.textMuted}>{hasScrollDown ? symbols.scrollDown : ' '}</Text>
				</Box>
			)}
		</Box>
	)
}
