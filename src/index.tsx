import { Box, render, useApp, useInput } from 'ink'
import meow from 'meow'
import { useEffect } from 'react'
import { useAppStore } from './store/app-store.js'
import { HomeView, ItemView, TableView } from './views/index.js'

const cli = meow(
	`
	Usage
	  $ dynotui [options]

	Options
	  --profile, -p  AWS profile to use
	  --region, -r   AWS region (e.g., us-east-1)
	  --help         Show this help message
	  --version      Show version

	Examples
	  $ dynotui
	  $ dynotui --profile prod --region eu-west-1
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

function App({ profile, region }: { profile?: string; region?: string }) {
	const { exit } = useApp()
	const { currentView, setProfile, setRegion } = useAppStore()

	useEffect(() => {
		if (profile) setProfile(profile)
		if (region) setRegion(region)
	}, [profile, region, setProfile, setRegion])

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
			{currentView.view === 'table' && <TableView state={currentView} />}
			{currentView.view === 'item' && <ItemView state={currentView} />}
		</Box>
	)
}

render(<App profile={cli.flags.profile} region={cli.flags.region} />)
