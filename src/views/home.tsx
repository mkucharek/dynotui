import { Box, Text, useInput } from 'ink'
import { useEffect, useMemo, useState } from 'react'
import {
	Footer,
	Header,
	InlineSelector,
	Loading,
	Panel,
	ProfileList,
	type SelectorItem,
	TableList,
} from '../components/index.js'
import { type AwsProfile, getAwsRegions, listProfiles } from '../services/aws-config.js'
import { resetClient } from '../services/dynamodb/index.js'
import { useAppStore } from '../store/app-store.js'
import { useTables } from '../store/use-tables.js'

type HomeTab = 'profiles' | 'tables'
type HomeMode = 'browsing' | 'selecting-region-behavior' | 'selecting-region' | 'info-modal'

type TabBarProps = {
	activeTab: HomeTab
}

function TabBar({ activeTab }: TabBarProps) {
	const profilesLabel = activeTab === 'profiles' ? '[1]-Profiles' : '-1-Profiles'
	const tablesLabel = activeTab === 'tables' ? '[2]-Tables' : '-2-Tables'
	return (
		<Text>
			<Text color={activeTab === 'profiles' ? 'cyan' : undefined} bold={activeTab === 'profiles'}>
				{profilesLabel}
			</Text>
			<Text> - </Text>
			<Text color={activeTab === 'tables' ? 'cyan' : undefined} bold={activeTab === 'tables'}>
				{tablesLabel}
			</Text>
		</Text>
	)
}

export function HomeView() {
	const { currentView, navigate, profile, region, setRuntimeProfile, setRuntimeRegion } =
		useAppStore()
	const { tables, isLoading, error, hasMore, initialized, fetchTables, fetchNextPage, refresh } =
		useTables()

	const initialIndex = currentView.view === 'home' ? (currentView.selectedIndex ?? 0) : 0
	const [tableSelectedIndex, setTableSelectedIndex] = useState(initialIndex)
	const [profileSelectedIndex, setProfileSelectedIndex] = useState(0)
	const [activeTab, setActiveTab] = useState<HomeTab>('tables')
	const [mode, setMode] = useState<HomeMode>('browsing')
	const [pendingProfile, setPendingProfile] = useState<AwsProfile | null>(null)

	const profiles = useMemo(() => {
		const items = listProfiles()
		if (items.length === 0) {
			return [{ name: 'default' }]
		}
		return items
	}, [])

	// Region behavior options for the two-step profile selection
	const regionBehaviorOptions = useMemo<SelectorItem[]>(() => {
		if (!pendingProfile) return []
		const profileRegion = pendingProfile.region ?? 'us-east-1'
		return [
			{
				value: 'profile-default',
				label: `Use profile default (${profileRegion})`,
			},
			{
				value: 'keep-current',
				label: `Keep current region (${region})`,
			},
			{
				value: 'choose-region',
				label: 'Choose region...',
			},
		]
	}, [pendingProfile, region])

	// All AWS regions for region selector
	const regions = useMemo<SelectorItem[]>(() => {
		return getAwsRegions().map((r) => ({ value: r, label: r }))
	}, [])

	const currentRegionIndex = useMemo(() => {
		const idx = regions.findIndex((r) => r.value === region)
		return idx >= 0 ? idx : 0
	}, [regions, region])

	// Find current profile index
	const currentProfileIndex = useMemo(() => {
		const idx = profiles.findIndex((p) => p.name === (profile ?? 'default'))
		return idx >= 0 ? idx : 0
	}, [profiles, profile])

	useEffect(() => {
		if (!initialized && !isLoading) {
			fetchTables(true)
		}
	}, [initialized, isLoading, fetchTables])

	// Set profile selected index to current profile on mount
	useEffect(() => {
		setProfileSelectedIndex(currentProfileIndex)
	}, [currentProfileIndex])

	const handleProfileEnter = (selectedProfile: AwsProfile) => {
		// Start two-step flow: show region behavior selector
		setPendingProfile(selectedProfile)
		setMode('selecting-region-behavior')
	}

	const handleRegionBehaviorSelect = (value: string) => {
		if (!pendingProfile) return

		const newProfile = pendingProfile.name === 'default' ? undefined : pendingProfile.name

		if (value === 'profile-default') {
			// Use profile's default region
			setRuntimeProfile(newProfile, 'default')
			resetClient()
			setTableSelectedIndex(0)
			setPendingProfile(null)
			setMode('browsing')
			setActiveTab('tables')
		} else if (value === 'keep-current') {
			// Keep current region - set profile first, then override region
			setRuntimeProfile(newProfile, 'default')
			setRuntimeRegion(region, 'default')
			resetClient()
			setTableSelectedIndex(0)
			setPendingProfile(null)
			setMode('browsing')
			setActiveTab('tables')
		} else if (value === 'choose-region') {
			// Show region selector (keep pendingProfile for next step)
			setMode('selecting-region')
		}
	}

	const handleRegionSelect = (selectedRegion: string) => {
		if (!pendingProfile) return

		const newProfile = pendingProfile.name === 'default' ? undefined : pendingProfile.name
		setRuntimeProfile(newProfile, 'default')
		setRuntimeRegion(selectedRegion, 'default')
		resetClient()
		setTableSelectedIndex(0)
		setPendingProfile(null)
		setMode('browsing')
		setActiveTab('tables')
	}

	const handleRegionCancel = () => {
		// Go back to region behavior selection
		setMode('selecting-region-behavior')
	}

	const handleRegionBehaviorCancel = () => {
		setPendingProfile(null)
		setMode('browsing')
	}

	useInput((input, key) => {
		if (mode !== 'browsing') return

		// Tab switching
		if (input === '1') {
			setActiveTab('profiles')
			return
		}
		if (input === '2') {
			setActiveTab('tables')
			return
		}

		// Info modal
		if (input === '?') {
			setMode('info-modal')
			return
		}

		// Settings navigation
		if (input === 's') {
			navigate({ view: 'settings' }, { view: 'home', selectedIndex: tableSelectedIndex })
			return
		}

		// Tables tab specific
		if (activeTab === 'tables') {
			if (input === 'j' || key.downArrow) {
				setTableSelectedIndex((i) => Math.min(i + 1, tables.length - 1))
			} else if (input === 'k' || key.upArrow) {
				setTableSelectedIndex((i) => Math.max(i - 1, 0))
			} else if (input === 'n' && hasMore && !isLoading) {
				fetchNextPage()
			} else if (input === 'r') {
				refresh()
			} else if (key.return && tables[tableSelectedIndex]) {
				navigate(
					{ view: 'table', tableName: tables[tableSelectedIndex], mode: 'scan' },
					{ view: 'home', selectedIndex: tableSelectedIndex },
				)
			}
		}

		// Profiles tab specific - navigation handled by ProfileList component
	})

	const tablesBindings = [
		{ key: 'Enter', label: 'Open' },
		{ key: '?', label: 'Info' },
		{ key: 's', label: 'Settings' },
		{ key: 'n', label: 'Load More' },
		{ key: 'r', label: 'Refresh' },
		{ key: 'q', label: 'Quit' },
	]

	const profilesBindings = [
		{ key: 'Enter', label: 'Select' },
		{ key: '?', label: 'Info' },
		{ key: 's', label: 'Settings' },
		{ key: 'q', label: 'Quit' },
	]

	const selectorBindings = [
		{ key: 'Enter', label: 'Select' },
		{ key: 'Esc', label: 'Cancel' },
	]

	const renderContent = () => {
		// Region behavior selection (step 2 of profile selection)
		if (mode === 'selecting-region-behavior' && pendingProfile) {
			return (
				<InlineSelector
					title={`Region for '${pendingProfile.name}'`}
					items={regionBehaviorOptions}
					initialIndex={0}
					onSelect={handleRegionBehaviorSelect}
					onCancel={handleRegionBehaviorCancel}
				/>
			)
		}

		// Region selection (step 3 if "Choose region" was selected)
		if (mode === 'selecting-region' && pendingProfile) {
			return (
				<InlineSelector
					title={`Select region for '${pendingProfile.name}'`}
					items={regions}
					initialIndex={currentRegionIndex}
					onSelect={handleRegionSelect}
					onCancel={handleRegionCancel}
				/>
			)
		}

		// Info modal
		if (mode === 'info-modal') {
			return <InfoModalContent onClose={() => setMode('browsing')} />
		}

		// Profiles tab
		if (activeTab === 'profiles') {
			return (
				<ProfileList
					profiles={profiles}
					currentProfile={profile}
					selectedIndex={profileSelectedIndex}
					onSelect={setProfileSelectedIndex}
					onEnter={handleProfileEnter}
					focused={mode === 'browsing'}
				/>
			)
		}

		// Tables tab (default)
		return (
			<>
				{isLoading && tables.length === 0 ? (
					<Loading message="Loading tables..." />
				) : error ? (
					<Box>
						<Text color="red">{error}</Text>
					</Box>
				) : (
					<TableList
						tables={tables}
						selectedIndex={tableSelectedIndex}
						onSelect={setTableSelectedIndex}
						onEnter={(tableName) => {
							navigate(
								{ view: 'table', tableName, mode: 'scan' },
								{ view: 'home', selectedIndex: tableSelectedIndex },
							)
						}}
						focused={mode === 'browsing'}
					/>
				)}

				{hasMore && !isLoading && tables.length > 0 && (
					<Box marginTop={1}>
						<Loading message="Press 'n' to load more..." />
					</Box>
				)}
			</>
		)
	}

	const getFooterBindings = () => {
		if (mode === 'selecting-region-behavior' || mode === 'selecting-region') return selectorBindings
		if (mode === 'info-modal') return [{ key: 'Esc', label: 'Close' }]
		return activeTab === 'tables' ? tablesBindings : profilesBindings
	}

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Header />

			<Box flexGrow={1} padding={1}>
				<Panel title={<TabBar activeTab={activeTab} />} focused flexGrow={1}>
					{renderContent()}
				</Panel>
			</Box>

			<Footer bindings={getFooterBindings()} />
		</Box>
	)
}

// Info Modal Content Component
function InfoModalContent({ onClose }: { onClose: () => void }) {
	const { runtimeProfile, runtimeRegion, configDefaults } = useAppStore()

	useInput((_, key) => {
		if (key.escape || key.return) {
			onClose()
		}
	})

	const getSourceLabel = (source: string) => {
		switch (source) {
			case 'cli':
				return 'CLI argument'
			case 'env':
				return 'Environment variable'
			case 'config':
				return 'Config file'
			case 'default':
				return 'Default'
			default:
				return source
		}
	}

	return (
		<Box flexDirection="column" gap={1}>
			<Text bold color="cyan">
				Current Configuration
			</Text>

			<Box flexDirection="column">
				<Text bold>Current Session</Text>
				<Text>
					Profile: <Text color="yellow">{runtimeProfile.value ?? 'default'}</Text>
					<Text dimColor> ({getSourceLabel(runtimeProfile.source)})</Text>
				</Text>
				<Text>
					Region: <Text color="yellow">{runtimeRegion.value}</Text>
					<Text dimColor> ({getSourceLabel(runtimeRegion.source)})</Text>
				</Text>
			</Box>

			<Box flexDirection="column">
				<Text bold>Config Defaults</Text>
				<Text dimColor>~/.config/dynotui/config.json</Text>
				<Text>
					Profile: <Text color="gray">{configDefaults.profile ?? 'not set'}</Text>
				</Text>
				<Text>
					Region: <Text color="gray">{configDefaults.region ?? 'not set (auto)'}</Text>
				</Text>
				<Text>
					Page Size: <Text color="gray">{configDefaults.pageSize}</Text>
				</Text>
			</Box>

			<Box marginTop={1}>
				<Text dimColor>Press Esc or Enter to close</Text>
			</Box>
		</Box>
	)
}
