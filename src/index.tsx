import { stdout } from 'node:process'
import { Box, render, useApp, useInput } from 'ink'
import meow from 'meow'
import { useEffect } from 'react'
import { resolveConfig } from './services/config-resolver.js'
import { useAppStore } from './store/app-store.js'
import type { RuntimeConfig } from './types/config.js'
import { HomeView, ItemView, SettingsView, TableView } from './views/index.js'

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

function App({ initialConfig }: { initialConfig: RuntimeConfig }) {
	const { exit } = useApp()
	const { currentView, initializeFromResolution } = useAppStore()

	useEffect(() => {
		initializeFromResolution(initialConfig)
	}, [initializeFromResolution, initialConfig])

	// Global exit with Ctrl+C
	useInput(
		(input, key) => {
			if (key.ctrl && input === 'c') {
				exit()
			}
		},
		{ isActive: true },
	)

	// Quit with 'q' only from home view
	useInput(
		(input) => {
			if (input === 'q') {
				exit()
			}
		},
		{ isActive: currentView.view === 'home' },
	)

	return (
		<Box flexDirection="column" width="100%" height="100%">
			{currentView.view === 'home' && <HomeView />}
			{currentView.view === 'settings' && <SettingsView />}
			{currentView.view === 'table' && <TableView state={currentView} />}
			{currentView.view === 'item' && <ItemView state={currentView} />}
		</Box>
	)
}

stdout.write('\x1Bc')
render(<App initialConfig={resolvedConfig} />)
