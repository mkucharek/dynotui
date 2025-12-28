import { Box, Text, useInput } from 'ink'
import { useMemo, useState } from 'react'
import { Footer, Header, InlineSelector, Panel, type SelectorItem } from '../components/index.js'
import { getAwsRegions, listProfiles } from '../services/aws-config.js'
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
	const { configDefaults, setConfigDefault, goBack } = useAppStore()
	const [mode, setMode] = useState<SettingsMode>('browsing')
	const [selectedIndex, setSelectedIndex] = useState(0)

	const settings: SettingItem[] = [
		{
			key: 'profile',
			label: 'Default Profile',
			value: configDefaults.profile ?? 'not set',
			mode: 'selecting-profile',
		},
		{
			key: 'region',
			label: 'Default Region',
			value: configDefaults.region ?? 'auto',
			mode: 'selecting-region',
		},
		{
			key: 'pageSize',
			label: 'Page Size',
			value: String(configDefaults.pageSize),
			mode: 'selecting-pageSize',
		},
	]

	const profiles = useMemo<SelectorItem[]>(() => {
		const items = listProfiles()
		const result: SelectorItem[] = [{ value: '', label: 'not set', description: 'use default' }]
		if (items.length === 0) {
			result.push({ value: 'default', label: 'default' })
		} else {
			for (const p of items) {
				result.push({
					value: p.name,
					label: p.name,
					description: p.region,
				})
			}
		}
		return result
	}, [])

	const regions = useMemo<SelectorItem[]>(() => {
		const result: SelectorItem[] = [
			{ value: '', label: 'auto', description: "use profile's region" },
		]
		for (const r of getAwsRegions()) {
			result.push({ value: r, label: r })
		}
		return result
	}, [])

	const pageSizes = useMemo<SelectorItem[]>(() => {
		return PAGE_SIZE_OPTIONS.map((s) => ({ value: String(s), label: String(s) }))
	}, [])

	const currentProfileIndex = useMemo(() => {
		if (!configDefaults.profile) return 0 // "not set" is first
		const idx = profiles.findIndex((p) => p.value === configDefaults.profile)
		return idx >= 0 ? idx : 0
	}, [profiles, configDefaults.profile])

	const currentRegionIndex = useMemo(() => {
		if (!configDefaults.region) return 0 // "auto" is first
		const idx = regions.findIndex((r) => r.value === configDefaults.region)
		return idx >= 0 ? idx : 0
	}, [regions, configDefaults.region])

	const currentPageSizeIndex = useMemo(() => {
		const idx = pageSizes.findIndex((s) => s.value === String(configDefaults.pageSize))
		return idx >= 0 ? idx : 0
	}, [pageSizes, configDefaults.pageSize])

	const handleProfileSelect = (value: string) => {
		setConfigDefault('profile', value || undefined)
		setMode('browsing')
	}

	const handleRegionSelect = (value: string) => {
		setConfigDefault('region', value || undefined)
		setMode('browsing')
	}

	const handlePageSizeSelect = (value: string) => {
		setConfigDefault('pageSize', Number(value))
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
					title="Select Default Profile"
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
					title="Select Default Region"
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
			<Box flexDirection="column" gap={1}>
				<Box flexDirection="column" marginBottom={1}>
					<Text dimColor>These values are saved to config and used on next run.</Text>
					<Text dimColor>They do NOT affect the current session.</Text>
				</Box>

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
				<Panel title="Default Settings" focused flexGrow={1}>
					{renderContent()}
				</Panel>
			</Box>

			<Footer bindings={mode === 'browsing' ? browsingBindings : selectorBindings} />
		</Box>
	)
}
