import { stdout } from 'node:process'
import { Box, render, Text, useApp, useInput, useStdout } from 'ink'
import meow from 'meow'
import { useEffect } from 'react'
import { Footer, Header, Panel, Sidebar, SplitLayout } from './components/index.js'
import { resolveConfig } from './services/config-resolver.js'
import { useAppStore } from './store/app-store.js'
import { borders, colors } from './theme.js'
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
	const { currentView, focusedPanel } = useAppStore()
	const isMainFocused = focusedPanel === 'main'

	if (currentView.view === 'home') {
		return (
			<Box
				flexDirection="column"
				flexGrow={1}
				justifyContent="center"
				alignItems="center"
				height={terminalHeight}
			>
				<Text color={colors.textMuted}>Select a table from the sidebar</Text>
				<Text color={colors.textMuted} dimColor>
					Use j/k to navigate, Enter to select
				</Text>
			</Box>
		)
	}

	if (currentView.view === 'settings') {
		return (
			<Panel title="Settings" focused={isMainFocused} flexGrow={1} height={terminalHeight}>
				<SettingsView />
			</Panel>
		)
	}

	if (currentView.view === 'table') {
		const title = `${currentView.tableName} › ${currentView.mode}`
		return (
			<Panel title={title} focused={isMainFocused} flexGrow={1} height={terminalHeight}>
				<TableView state={currentView} maxHeight={terminalHeight - 4} />
			</Panel>
		)
	}

	if (currentView.view === 'item') {
		return (
			<Panel title="Item Details" focused={isMainFocused} flexGrow={1} height={terminalHeight}>
				<ItemView state={currentView} />
			</Panel>
		)
	}

	return null
}

function App({ initialConfig }: { initialConfig: RuntimeConfig }) {
	const { exit } = useApp()
	const { stdout: stdoutStream } = useStdout()
	const {
		currentView,
		focusedPanel,
		cycleFocusedPanel,
		cycleCurrentPanelTab,
		setFocusedPanel,
		initializeFromResolution,
	} = useAppStore()

	const terminalHeight = stdoutStream?.rows ?? 24
	const terminalWidth = stdoutStream?.columns ?? 80

	useEffect(() => {
		initializeFromResolution(initialConfig)
	}, [initializeFromResolution, initialConfig])

	// Ctrl+C to exit
	useInput(
		(input, key) => {
			if (key.ctrl && input === 'c') {
				exit()
			}
		},
		{ isActive: true },
	)

	// q to quit from home view
	useInput(
		(input) => {
			if (input === 'q') {
				exit()
			}
		},
		{ isActive: currentView.view === 'home' },
	)

	// Tab to cycle panels
	useInput(
		(_, key) => {
			if (key.tab) {
				cycleFocusedPanel(key.shift ? 'prev' : 'next')
			}
		},
		{ isActive: true },
	)

	// 1/2/0 to switch panels directly
	useInput(
		(input) => {
			if (input === '1') {
				setFocusedPanel('connection')
			} else if (input === '2') {
				setFocusedPanel('browse')
			} else if (input === '0') {
				setFocusedPanel('main')
			}
		},
		{ isActive: true },
	)

	// h/l or left/right arrows to switch tabs within current panel
	useInput(
		(input, key) => {
			if (input === 'h' || key.leftArrow) {
				cycleCurrentPanelTab('prev')
			} else if (input === 'l' || key.rightArrow) {
				cycleCurrentPanelTab('next')
			}
		},
		{ isActive: focusedPanel !== 'main' },
	)

	// Outer frame (2) + Header (1) + Separator (1) + Footer (1) + Separator (1) = 6 lines
	const contentHeight = terminalHeight - 6
	const separatorWidth = Math.max(1, terminalWidth - 2)

	return (
		<Box
			flexDirection="column"
			width="100%"
			height={terminalHeight}
			borderStyle={borders.style}
			borderColor={colors.border}
		>
			<Header />
			<Box width="100%">
				<Text color={colors.border}>{'─'.repeat(separatorWidth)}</Text>
			</Box>
			<SplitLayout
				sidebar={<Sidebar maxHeight={contentHeight} />}
				main={<MainPanel terminalHeight={contentHeight} />}
				sidebarWidth={30}
				height={contentHeight}
			/>
			<Box width="100%">
				<Text color={colors.border}>{'─'.repeat(separatorWidth)}</Text>
			</Box>
			<Footer />
		</Box>
	)
}

// Enter alternate screen buffer (preserves terminal scrollback)
stdout.write('\x1B[?1049h')
const instance = render(<App initialConfig={resolvedConfig} />)
instance.waitUntilExit().then(() => {
	stdout.write('\x1B[?1049l') // Restore main screen
})
