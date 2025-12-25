import { Box, useApp, useInput } from 'ink'
import { useAppStore } from '../store/app-store.js'
import { HomeView, ItemView, TableView } from '../views/index.js'

export default function Index() {
	const { exit } = useApp()
	const currentView = useAppStore((s) => s.currentView)

	// Global keybindings
	useInput((input, key) => {
		if (input === 'q' && currentView.view === 'home') {
			exit()
		} else if (key.ctrl && input === 'c') {
			exit()
		}
	})

	return (
		<Box flexDirection="column" width="100%" height="100%">
			{currentView.view === 'home' && <HomeView />}
			{currentView.view === 'table' && <TableView state={currentView} />}
			{currentView.view === 'item' && <ItemView state={currentView} />}
		</Box>
	)
}
