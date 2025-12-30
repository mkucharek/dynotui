import { Box, Text } from 'ink'
import { useEffect, useMemo, useState } from 'react'
import { getAwsRegions, listProfiles } from '../../services/aws-config.js'
import { getErrorDisplayMessage } from '../../services/dynamodb/errors.js'
import { resetClient } from '../../services/dynamodb/index.js'
import { useAppStore } from '../../store/app-store.js'
import { useTables } from '../../store/use-tables.js'
import { colors } from '../../theme.js'
import { SidebarPanel } from './sidebar-panel.js'
import { type SidebarItem, SidebarSection } from './sidebar-section.js'

export type SidebarProps = {
	maxHeight?: number
}

export function Sidebar({ maxHeight }: SidebarProps) {
	const {
		profile,
		region,
		focusedPanel,
		connectionTab,
		browseTab,
		setRuntimeProfile,
		setRuntimeRegion,
		navigate,
		currentView,
	} = useAppStore()

	const { tables, isLoading, error, initialized, fetchTables } = useTables()

	const [profileIndex, setProfileIndex] = useState(0)
	const [regionIndex, setRegionIndex] = useState(0)
	const [tableIndex, setTableIndex] = useState(0)

	const profiles = useMemo(() => {
		const items = listProfiles()
		if (items.length === 0) {
			return [{ name: 'default' }]
		}
		return items
	}, [])

	const regions = useMemo(() => getAwsRegions(), [])

	const profileItems: SidebarItem[] = useMemo(
		() =>
			profiles.map((p) => ({
				id: p.name,
				label: p.name,
				secondary: p.region,
			})),
		[profiles],
	)

	const regionItems: SidebarItem[] = useMemo(
		() =>
			regions.map((r) => ({
				id: r,
				label: r,
			})),
		[regions],
	)

	const tableItems: SidebarItem[] = useMemo(
		() =>
			tables.map((t) => ({
				id: t,
				label: t,
			})),
		[tables],
	)

	// Initialize tables on mount
	useEffect(() => {
		if (!initialized && !isLoading) {
			fetchTables(true)
		}
	}, [initialized, isLoading, fetchTables])

	// Sync profile index with current profile
	useEffect(() => {
		const idx = profiles.findIndex((p) => p.name === (profile ?? 'default'))
		if (idx >= 0) setProfileIndex(idx)
	}, [profiles, profile])

	// Sync region index with current region
	useEffect(() => {
		const idx = regions.indexOf(region)
		if (idx >= 0) setRegionIndex(idx)
	}, [regions, region])

	// Sync table index with current table view
	useEffect(() => {
		if (currentView.view === 'table') {
			const idx = tables.indexOf(currentView.tableName)
			if (idx >= 0) setTableIndex(idx)
		}
	}, [currentView, tables])

	const handleProfileSelect = (item: SidebarItem) => {
		const newProfile = item.id === 'default' ? undefined : item.id
		resetClient()
		setRuntimeProfile(newProfile, 'default')
	}

	const handleRegionSelect = (item: SidebarItem) => {
		resetClient()
		setRuntimeRegion(item.id, 'default')
	}

	const handleTableSelect = (item: SidebarItem) => {
		navigate({ view: 'table', tableName: item.id, mode: 'scan' }, currentView)
	}

	const currentTableName =
		currentView.view === 'table' || currentView.view === 'item' ? currentView.tableName : undefined
	const isConnectionFocused = focusedPanel === 'connection'
	const isBrowseFocused = focusedPanel === 'browse'

	// Calculate heights: Connection panel gets fixed height, Browse gets the rest
	// Panel height includes: border (2) + tab header (1) + separator (1) + content
	const connectionPanelHeight = 10
	const browsePanelHeight = maxHeight ? maxHeight - connectionPanelHeight - 1 : undefined

	return (
		<Box flexDirection="column" height={maxHeight} overflowY="hidden">
			{/* Connection Panel (Profile / Region) */}
			<SidebarPanel
				tabs={[
					{ id: 'profile', label: 'Profile' },
					{ id: 'region', label: 'Region' },
				]}
				activeTab={connectionTab}
				panelNumber={1}
				focused={isConnectionFocused}
				height={connectionPanelHeight}
			>
				{connectionTab === 'profile' && (
					<SidebarSection
						items={profileItems}
						activeId={profile ?? 'default'}
						selectedIndex={profileIndex}
						onSelect={setProfileIndex}
						onEnter={handleProfileSelect}
						focused={isConnectionFocused}
						maxVisibleItems={connectionPanelHeight - 4}
					/>
				)}
				{connectionTab === 'region' && (
					<SidebarSection
						items={regionItems}
						activeId={region}
						selectedIndex={regionIndex}
						onSelect={setRegionIndex}
						onEnter={handleRegionSelect}
						focused={isConnectionFocused}
						maxVisibleItems={connectionPanelHeight - 4}
					/>
				)}
			</SidebarPanel>

			{/* Browse Panel (Tables / Saved) */}
			<SidebarPanel
				tabs={[
					{ id: 'tables', label: 'Tables' },
					{ id: 'saved', label: 'Saved' },
				]}
				activeTab={browseTab}
				panelNumber={2}
				focused={isBrowseFocused}
				height={browsePanelHeight}
				flexGrow={1}
			>
				{browseTab === 'tables' && (
					<SidebarSection
						items={tableItems}
						activeId={currentTableName}
						selectedIndex={tableIndex}
						onSelect={setTableIndex}
						onEnter={handleTableSelect}
						focused={isBrowseFocused}
						maxVisibleItems={browsePanelHeight ? browsePanelHeight - 4 : undefined}
						flexGrow={1}
						error={error ? getErrorDisplayMessage(error) : undefined}
						isLoading={isLoading}
					/>
				)}
				{browseTab === 'saved' && (
					<Box flexDirection="column" padding={1}>
						<Text color={colors.textMuted}>No saved queries yet</Text>
						<Text color={colors.textMuted} dimColor>
							Save queries from table view
						</Text>
					</Box>
				)}
			</SidebarPanel>
		</Box>
	)
}
