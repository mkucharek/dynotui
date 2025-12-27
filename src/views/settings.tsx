import { Box, Text, useInput } from 'ink'
import { useMemo, useState } from 'react'
import { Footer, Header, InlineSelector, Panel, type SelectorItem } from '../components/index.js'
import { getAwsRegions, listProfiles } from '../services/aws-config.js'
import { resetClient } from '../services/dynamodb/index.js'
import { useAppStore } from '../store/app-store.js'

type SettingsMode = 'browsing' | 'selecting-profile' | 'selecting-region' | 'selecting-pageSize'

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200]

type SettingItem = {
	key: string
	label: string
	value: string
	mode: SettingsMode
}

export function SettingsView() {
	const { profile, region, pageSize, setProfile, setRegion, setPageSize, goBack } = useAppStore()
	const [mode, setMode] = useState<SettingsMode>('browsing')
	const [selectedIndex, setSelectedIndex] = useState(0)

	const settings: SettingItem[] = [
		{
			key: 'profile',
			label: 'AWS Profile',
			value: profile ?? 'default',
			mode: 'selecting-profile',
		},
		{ key: 'region', label: 'AWS Region', value: region, mode: 'selecting-region' },
		{ key: 'pageSize', label: 'Page Size', value: String(pageSize), mode: 'selecting-pageSize' },
	]

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

	const pageSizes = useMemo<SelectorItem[]>(() => {
		return PAGE_SIZE_OPTIONS.map((s) => ({ value: String(s), label: String(s) }))
	}, [])

	const currentProfileIndex = useMemo(() => {
		const idx = profiles.findIndex((p) => p.value === (profile ?? 'default'))
		return idx >= 0 ? idx : 0
	}, [profiles, profile])

	const currentRegionIndex = useMemo(() => {
		const idx = regions.findIndex((r) => r.value === region)
		return idx >= 0 ? idx : 0
	}, [regions, region])

	const currentPageSizeIndex = useMemo(() => {
		const idx = pageSizes.findIndex((s) => s.value === String(pageSize))
		return idx >= 0 ? idx : 0
	}, [pageSizes, pageSize])

	const handleProfileSelect = (value: string) => {
		setProfile(value === 'default' ? undefined : value)
		resetClient()
		setMode('browsing')
	}

	const handleRegionSelect = (value: string) => {
		setRegion(value)
		resetClient()
		setMode('browsing')
	}

	const handlePageSizeSelect = (value: string) => {
		setPageSize(Number(value))
		setMode('browsing')
	}

	const handleSelectorCancel = () => {
		setMode('browsing')
	}

	useInput((input, key) => {
		if (mode !== 'browsing') return

		if (input === 'j' || key.downArrow) {
			setSelectedIndex((i) => Math.min(i + 1, settings.length - 1))
		} else if (input === 'k' || key.upArrow) {
			setSelectedIndex((i) => Math.max(i - 1, 0))
		} else if (key.return) {
			const setting = settings[selectedIndex]
			if (setting) {
				setMode(setting.mode)
			}
		} else if (key.escape) {
			goBack()
		}
	})

	const browsingBindings = [
		{ key: 'j/k', label: 'Navigate' },
		{ key: 'Enter', label: 'Edit' },
		{ key: 'Esc', label: 'Back' },
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

		if (mode === 'selecting-pageSize') {
			return (
				<InlineSelector
					title="Select Page Size"
					items={pageSizes}
					initialIndex={currentPageSizeIndex}
					onSelect={handlePageSizeSelect}
					onCancel={handleSelectorCancel}
				/>
			)
		}

		return (
			<Box flexDirection="column">
				{settings.map((setting, index) => (
					<Box key={setting.key} gap={2}>
						<Text color={selectedIndex === index ? 'cyan' : undefined}>
							{selectedIndex === index ? '>' : ' '}
						</Text>
						<Text bold={selectedIndex === index}>{setting.label}:</Text>
						<Text color="yellow">{setting.value}</Text>
					</Box>
				))}
			</Box>
		)
	}

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Header />

			<Box flexGrow={1} padding={1}>
				<Panel title="Settings" focused flexGrow={1}>
					{renderContent()}
				</Panel>
			</Box>

			<Footer bindings={mode === 'browsing' ? browsingBindings : selectorBindings} />
		</Box>
	)
}
