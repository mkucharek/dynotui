import { Box } from 'ink'
import { useMemo } from 'react'
import { getAwsRegions, listProfiles } from '../../services/aws-config.js'
import { getErrorDisplayMessage } from '../../services/dynamodb/errors.js'
import { useAppStore } from '../../store/app-store.js'
import { useTables } from '../../store/use-tables.js'
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

	const { tables, isLoading, error } = useTables()

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

	// Derive current table name for active state
	const currentTableName =
		currentView.view === 'table' || currentView.view === 'item' ? currentView.tableName : undefined

	const handleProfileSelect = (item: SidebarItem) => {
		const newProfile = item.id === 'default' ? undefined : item.id
		setRuntimeProfile(newProfile, 'default')
	}

	const handleRegionSelect = (item: SidebarItem) => {
		setRuntimeRegion(item.id, 'default')
	}

	const handleTableSelect = (item: SidebarItem) => {
		navigate({ view: 'table', tableName: item.id, mode: 'scan' }, currentView)
	}

	const isConnectionFocused = focusedPanel === 'connection'
	const isBrowseFocused = focusedPanel === 'browse'

	// Calculate heights: Connection panel scales down at small heights
	// Panel height includes: border (2) + tab header (1) + separator (1) + content
	// At tight heights (<16), use compact 6-line connection panel (2 items visible)
	const connectionPanelHeight = maxHeight && maxHeight < 16 ? 6 : 10
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
						key={`profile-${profile ?? 'default'}`}
						items={profileItems}
						activeId={profile ?? 'default'}
						onEnter={handleProfileSelect}
						focused={isConnectionFocused}
						maxVisibleItems={connectionPanelHeight - 4}
					/>
				)}
				{connectionTab === 'region' && (
					<SidebarSection
						key={`region-${region}`}
						items={regionItems}
						activeId={region}
						onEnter={handleRegionSelect}
						focused={isConnectionFocused}
						maxVisibleItems={connectionPanelHeight - 4}
					/>
				)}
			</SidebarPanel>

			{/* Browse Panel (Tables) */}
			<SidebarPanel
				tabs={[{ id: 'tables', label: 'Tables' }]}
				activeTab={browseTab}
				panelNumber={2}
				focused={isBrowseFocused}
				height={browsePanelHeight}
				flexGrow={1}
			>
				{browseTab === 'tables' && (
					<SidebarSection
						key={`tables-${currentTableName ?? 'none'}`}
						items={tableItems}
						activeId={currentTableName}
						onEnter={handleTableSelect}
						focused={isBrowseFocused}
						maxVisibleItems={browsePanelHeight ? browsePanelHeight - 4 : undefined}
						flexGrow={1}
						error={error ? getErrorDisplayMessage(error) : undefined}
						isLoading={isLoading}
					/>
				)}
			</SidebarPanel>
		</Box>
	)
}
