import { Box, Text, useInput } from 'ink'
import { ItemDetail, MainPanel } from '../components/index.js'
import { TERMINAL } from '../constants/terminal.js'
import { useTerminal } from '../contexts/terminal-context.js'
import { useAppStore } from '../store/app-store.js'
import { colors, symbols } from '../theme.js'
import type { ItemViewState } from '../types/navigation.js'

export type ItemViewProps = {
	state: ItemViewState
	maxHeight?: number
}

export function ItemView({ state, maxHeight = 20 }: ItemViewProps) {
	const { tableName, item } = state
	const { contentHeight } = useTerminal()
	const { goBack, focusedPanel } = useAppStore()
	// Use context contentHeight with overhead subtraction
	const effectiveMaxHeight = maxHeight === 20 ? contentHeight : maxHeight
	const detailMaxHeight = Math.max(5, effectiveMaxHeight - TERMINAL.MAIN_PANEL_OVERHEAD - 2)

	const isMainFocused = focusedPanel === 'main'

	// Get primary key info for metadata
	const itemKeys = Object.keys(item)
	const firstKey = itemKeys[0]
	const firstValue = firstKey ? item[firstKey] : null

	useInput(
		(_input, key) => {
			if (key.escape) {
				goBack()
			}
		},
		{ isActive: isMainFocused },
	)

	const metadataContent = (
		<Box gap={1}>
			{firstKey && (
				<>
					<Text color={colors.dataKey}>{firstKey}:</Text>
					<Text color={firstValue === null ? colors.dataNull : colors.dataValue}>
						{firstValue === null ? symbols.null : String(firstValue)}
					</Text>
					<Text color={colors.border}>│</Text>
				</>
			)}
			<Text color={colors.textSecondary}>{itemKeys.length} attributes</Text>
		</Box>
	)

	return (
		<MainPanel
			title={`${tableName} › Item`}
			panelNumber={0}
			focused={isMainFocused}
			metadata={metadataContent}
		>
			<ItemDetail item={item} maxHeight={detailMaxHeight} />
		</MainPanel>
	)
}
