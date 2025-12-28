import { stdout } from 'node:process'
import { Box, render, Text, useApp, useInput, useStdout } from 'ink'
import meow from 'meow'
import { useEffect } from 'react'
import { Footer, Sidebar, SplitLayout } from './components/index.js'
import { resolveConfig } from './services/config-resolver.js'
import { useAppStore } from './store/app-store.js'
import type { RuntimeConfig } from './types/config.js'
import { ItemView, SettingsView, TableView } from './views/index.js'

const cli = meow(
	`
	Usage
	  $ dynotui [options]

	Options
	  --profile, -p  AWS profile to use
	  --region, -r   AWS region (e.g., us-east-1)
	  --help         Show this help message
	  --version      Show version

	Environment Variables
	  AWS_PROFILE    AWS profile (overridden by --profile)
	  AWS_REGION     AWS region (overridden by --region)

	Examples
	  $ dynotui
	  $ dynotui --profile prod --region eu-west-1
	  $ AWS_PROFILE=prod dynotui
`,
	{
		importMeta: import.meta,
		flags: {
			profile: {
				type: 'string',
				shortFlag: 'p',
			},
			region: {
				type: 'string',
				shortFlag: 'r',
			},
		},
	},
)

const resolvedConfig = resolveConfig({
	cliProfile: cli.flags.profile,
	cliRegion: cli.flags.region,
})

function MainPanel({ terminalHeight }: { terminalHeight: number }) {
	const { currentView } = useAppStore()
	const availableHeight = Math.max(10, terminalHeight - 6)

	if (currentView.view === 'home') {
		return (
			<Box
				flexDirection="column"
				padding={1}
				flexGrow={1}
				justifyContent="center"
				alignItems="center"
			>
				<Text dimColor>Select a table from the sidebar</Text>
			</Box>
		)
	}

	if (currentView.view === 'settings') {
		return <SettingsView />
	}

	if (currentView.view === 'table') {
		return <TableView state={currentView} maxHeight={availableHeight} />
	}

	if (currentView.view === 'item') {
		return <ItemView state={currentView} />
	}

	return null
}

function App({ initialConfig }: { initialConfig: RuntimeConfig }) {
	const { exit } = useApp()
	const { stdout: stdoutStream } = useStdout()
	const {
		currentView,
		focusedPanel,
		toggleFocusedPanel,
		setFocusedPanel,
		setSidebarSection,
		initializeFromResolution,
	} = useAppStore()

	const terminalHeight = stdoutStream?.rows ?? 24

	useEffect(() => {
		initializeFromResolution(initialConfig)
	}, [initializeFromResolution, initialConfig])

	useInput(
		(input, key) => {
			if (key.ctrl && input === 'c') {
				exit()
			}
		},
		{ isActive: true },
	)

	useInput(
		(input) => {
			if (input === 'q') {
				exit()
			}
		},
		{ isActive: currentView.view === 'home' },
	)

	useInput(
		(_, key) => {
			if (key.tab) {
				toggleFocusedPanel()
			}
		},
		{ isActive: true },
	)

	useInput(
		(input) => {
			if (input === '0') {
				setFocusedPanel('main')
			} else if (input === '1') {
				setFocusedPanel('sidebar')
				setSidebarSection('profiles')
			} else if (input === '2') {
				setFocusedPanel('sidebar')
				setSidebarSection('regions')
			} else if (input === '3') {
				setFocusedPanel('sidebar')
				setSidebarSection('tables')
			}
		},
		{ isActive: true },
	)

	const footerBindings = [
		{ key: '0-3', label: 'Panels' },
		{ key: 'j/k', label: 'Navigate' },
		{ key: 'Enter', label: 'Select' },
		...(currentView.view === 'table' && focusedPanel === 'main'
			? [
					{ key: 's', label: 'Scan' },
					{ key: 'q', label: 'Query' },
					{ key: 'f', label: 'Filter' },
					{ key: 'n', label: 'Next Page' },
					{ key: 'r', label: 'Refresh' },
				]
			: []),
		...(currentView.view !== 'home' ? [{ key: 'Esc', label: 'Back' }] : []),
		...(currentView.view === 'home' ? [{ key: 'q', label: 'Quit' }] : []),
	]

	const contentHeight = terminalHeight - 1

	return (
		<Box flexDirection="column" width="100%" height={terminalHeight}>
			<SplitLayout
				sidebar={<Sidebar maxHeight={contentHeight} />}
				main={<MainPanel terminalHeight={contentHeight} />}
				sidebarWidth={30}
				height={contentHeight}
			/>
			<Footer bindings={footerBindings} />
		</Box>
	)
}

stdout.write('\x1Bc')
render(<App initialConfig={resolvedConfig} />)
