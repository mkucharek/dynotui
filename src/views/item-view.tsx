import { Box, Text, useInput } from 'ink'
import { useEffect } from 'react'
import { ItemDetail, Panel } from '../components/index.js'
import { useAppStore } from '../store/app-store.js'
import type { ItemViewState } from '../types/navigation.js'

export type ItemViewProps = {
	state: ItemViewState
}

export function ItemView({ state }: ItemViewProps) {
	const { tableName, item } = state
	const { goBack, focusedPanel, setFocusedPanel } = useAppStore()

	const isMainFocused = focusedPanel === 'main'

	useInput(
		(_input, key) => {
			if (key.escape) {
				goBack()
			}
		},
		{ isActive: isMainFocused },
	)

	useEffect(() => {
		setFocusedPanel('main')
	}, [setFocusedPanel])

	return (
		<Box flexDirection="column" flexGrow={1} padding={1} gap={1}>
			{/* Table name */}
			<Text bold color="cyan">
				{tableName}
			</Text>

			{/* Item detail panel */}
			<Panel title="Item Detail" focused={isMainFocused} flexGrow={1}>
				<ItemDetail item={item} />
			</Panel>
		</Box>
	)
}
