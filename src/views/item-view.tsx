import { Box, Text, useInput } from 'ink'
import { Footer, Header, ItemDetail, Panel } from '../components/index.js'
import { useAppStore } from '../store/app-store.js'
import type { ItemViewState } from '../types/navigation.js'

export type ItemViewProps = {
	state: ItemViewState
}

export function ItemView({ state }: ItemViewProps) {
	const { tableName, item } = state
	const { goBack } = useAppStore()

	useInput((_input, key) => {
		if (key.escape) {
			goBack()
		}
	})

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Header />

			<Box flexGrow={1} padding={1} flexDirection="column" gap={1}>
				{/* Table name */}
				<Text bold color="cyan">
					{tableName}
				</Text>

				{/* Item detail panel */}
				<Panel title="Item Detail" focused flexGrow={1}>
					<ItemDetail item={item} />
				</Panel>
			</Box>

			<Footer
				bindings={[
					{ key: 'j/k', label: 'Scroll' },
					{ key: 'g/G', label: 'Top/Bottom' },
					{ key: 'Esc', label: 'Back' },
				]}
			/>
		</Box>
	)
}
