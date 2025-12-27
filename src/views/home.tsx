import { Box, Text, useInput } from 'ink'
import { useEffect, useMemo, useState } from 'react'
import {
	Footer,
	Header,
	InlineSelector,
	Loading,
	Panel,
	type SelectorItem,
	TableList,
} from '../components/index.js'
import { getAwsRegions, listProfiles } from '../services/aws-config.js'
import { resetClient } from '../services/dynamodb/index.js'
import { useAppStore } from '../store/app-store.js'
import { useTables } from '../store/use-tables.js'

type HomeMode = 'browsing' | 'selecting-profile' | 'selecting-region'

export function HomeView() {
	const { currentView, navigate, profile, region, setProfile, setRegion } = useAppStore()
	const { tables, isLoading, error, hasMore, initialized, fetchTables, fetchNextPage, refresh } =
		useTables()
	const initialIndex = currentView.view === 'home' ? (currentView.selectedIndex ?? 0) : 0
	const [selectedIndex, setSelectedIndex] = useState(initialIndex)
	const [mode, setMode] = useState<HomeMode>('browsing')

	const profiles = useMemo<SelectorItem[]>(() => {
		const items = listProfiles()
		if (items.length === 0) {
			return [{ value: 'default', label: 'default' }]
		}
		return items.map((p) => ({
			value: p.name,
			label: p.name,
			description: p.region,
		}))
	}, [])

	const regions = useMemo<SelectorItem[]>(() => {
		return getAwsRegions().map((r) => ({ value: r, label: r }))
	}, [])

	const currentProfileIndex = useMemo(() => {
		const idx = profiles.findIndex((p) => p.value === (profile ?? 'default'))
		return idx >= 0 ? idx : 0
	}, [profiles, profile])

	const currentRegionIndex = useMemo(() => {
		const idx = regions.findIndex((r) => r.value === region)
		return idx >= 0 ? idx : 0
	}, [regions, region])

	useEffect(() => {
		if (!initialized && !isLoading) {
			fetchTables(true)
		}
	}, [initialized, isLoading, fetchTables])

	const handleProfileSelect = (value: string) => {
		setProfile(value === 'default' ? undefined : value)
		resetClient()
		setSelectedIndex(0)
		setMode('browsing')
	}

	const handleRegionSelect = (value: string) => {
		setRegion(value)
		resetClient()
		setSelectedIndex(0)
		setMode('browsing')
	}

	const handleSelectorCancel = () => {
		setMode('browsing')
	}

	useInput((input, key) => {
		if (mode !== 'browsing') return

		if (input === 'j' || key.downArrow) {
			setSelectedIndex((i) => Math.min(i + 1, tables.length - 1))
		} else if (input === 'k' || key.upArrow) {
			setSelectedIndex((i) => Math.max(i - 1, 0))
		} else if (input === 'n' && hasMore && !isLoading) {
			fetchNextPage()
		} else if (input === 'r') {
			refresh()
		} else if (input === 'p') {
			setMode('selecting-profile')
		} else if (input === 'R') {
			setMode('selecting-region')
		} else if (input === 's') {
			navigate({ view: 'settings' }, { view: 'home', selectedIndex })
		} else if (key.return && tables[selectedIndex]) {
			navigate(
				{ view: 'table', tableName: tables[selectedIndex], mode: 'scan' },
				{ view: 'home', selectedIndex },
			)
		}
	})

	const handleTableSelect = (tableName: string) => {
		navigate({ view: 'table', tableName, mode: 'scan' }, { view: 'home', selectedIndex })
	}

	const browsingBindings = [
		{ key: 'Enter', label: 'Open' },
		{ key: 's', label: 'Settings' },
		{ key: 'n', label: 'Load More' },
		{ key: 'r', label: 'Refresh' },
		{ key: 'q', label: 'Quit' },
	]

	const selectorBindings = [
		{ key: 'Enter', label: 'Select' },
		{ key: 'Esc', label: 'Cancel' },
	]

	const renderContent = () => {
		if (mode === 'selecting-profile') {
			return (
				<InlineSelector
					title="Select AWS Profile"
					items={profiles}
					initialIndex={currentProfileIndex}
					onSelect={handleProfileSelect}
					onCancel={handleSelectorCancel}
				/>
			)
		}

		if (mode === 'selecting-region') {
			return (
				<InlineSelector
					title="Select AWS Region"
					items={regions}
					initialIndex={currentRegionIndex}
					onSelect={handleRegionSelect}
					onCancel={handleSelectorCancel}
				/>
			)
		}

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
						selectedIndex={selectedIndex}
						onSelect={setSelectedIndex}
						onEnter={handleTableSelect}
						focused={false}
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

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Header />

			<Box flexGrow={1} padding={1}>
				<Panel title={mode === 'browsing' ? 'Tables' : 'Settings'} focused flexGrow={1}>
					{renderContent()}
				</Panel>
			</Box>

			<Footer bindings={mode === 'browsing' ? browsingBindings : selectorBindings} />
		</Box>
	)
}
