import { stdout } from 'node:process'
import { Box, render, Text, useApp, useInput } from 'ink'
import meow from 'meow'
import { useEffect } from 'react'
import {
	Footer,
	Header,
	Panel,
	Sidebar,
	SplitLayout,
	TerminalTooSmall,
} from './components/index.js'
import { TerminalProvider, useTerminal } from './contexts/terminal-context.js'
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

function MainContent({ terminalHeight }: { terminalHeight: number }) {
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
		// TableView uses MainPanel component internally, pass full content height
		return <TableView state={currentView} maxHeight={terminalHeight} />
	}

	if (currentView.view === 'item') {
		// ItemView uses MainPanel internally
		return <ItemView state={currentView} maxHeight={terminalHeight} />
	}

	return null
}

function App({ initialConfig }: { initialConfig: RuntimeConfig }) {
	const { exit } = useApp()
	const { width, height, contentHeight, sidebarWidth, isTooSmall } = useTerminal()
	const {
		currentView,
		focusedPanel,
		inputMode,
		cycleFocusedPanel,
		cycleCurrentPanelTab,
		setFocusedPanel,
		initializeFromResolution,
	} = useAppStore()

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

	// Tab to cycle panels (disabled in form modes where Tab navigates fields)
	const isFormMode = inputMode === 'query-form' || inputMode === 'scan-filter'
	useInput(
		(_, key) => {
			if (key.tab) {
				cycleFocusedPanel(key.shift ? 'prev' : 'next')
			}
		},
		{ isActive: !isFormMode },
	)

	// 1/2/0 to switch panels directly (disabled in form modes)
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
		{ isActive: !isFormMode },
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

	// Show fallback when terminal too small
	if (isTooSmall) {
		return <TerminalTooSmall width={width} height={height} />
	}

	const separatorWidth = Math.max(1, width - 2)

	return (
		<Box
			flexDirection="column"
			width="100%"
			height={height}
			borderStyle={borders.style}
			borderColor={colors.border}
		>
			<Header />
			<Box width="100%">
				<Text color={colors.border}>{'─'.repeat(separatorWidth)}</Text>
			</Box>
			<SplitLayout
				sidebar={<Sidebar maxHeight={contentHeight} />}
				main={<MainContent terminalHeight={contentHeight} />}
				sidebarWidth={sidebarWidth}
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
const instance = render(
	<TerminalProvider>
		<App initialConfig={resolvedConfig} />
	</TerminalProvider>,
)
instance.waitUntilExit().then(() => {
	stdout.write('\x1B[?1049l') // Restore main screen
})
