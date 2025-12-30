import { Box } from 'ink'
import { useEffect, useMemo, useState } from 'react'
import { getAwsRegions, listProfiles } from '../../services/aws-config.js'
import { getErrorDisplayMessage } from '../../services/dynamodb/errors.js'
import { resetClient } from '../../services/dynamodb/index.js'
import { useAppStore } from '../../store/app-store.js'
import { useTables } from '../../store/use-tables.js'
import { type SidebarItem, SidebarSection } from './sidebar-section.js'

export type SidebarProps = {
	maxHeight?: number
}

export function Sidebar({ maxHeight }: SidebarProps) {
	const {
		profile,
		region,
		focusedPanel,
		sidebarSection,
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

	const currentTableName = currentView.view === 'table' ? currentView.tableName : undefined

	const profilesHeight = Math.min(profileItems.length + 2, 6)
	const regionsHeight = Math.min(regionItems.length + 2, 8)
	const tablesHeight = maxHeight
		? Math.max(5, maxHeight - profilesHeight - regionsHeight - 4)
		: undefined

	return (
		<Box
			flexDirection="column"
			paddingX={1}
			paddingY={0}
			flexGrow={1}
			height={maxHeight}
			overflowY="hidden"
		>
			<SidebarSection
				shortcut="1"
				title="Profiles"
				items={profileItems}
				activeId={profile ?? 'default'}
				selectedIndex={profileIndex}
				onSelect={setProfileIndex}
				onEnter={handleProfileSelect}
				focused={focusedPanel === 'sidebar' && sidebarSection === 'profiles'}
				maxVisibleItems={4}
			/>

			<SidebarSection
				shortcut="2"
				title="Regions"
				items={regionItems}
				activeId={region}
				selectedIndex={regionIndex}
				onSelect={setRegionIndex}
				onEnter={handleRegionSelect}
				focused={focusedPanel === 'sidebar' && sidebarSection === 'regions'}
				maxVisibleItems={6}
			/>

			<SidebarSection
				shortcut="3"
				title="Tables"
				items={tableItems}
				activeId={currentTableName}
				selectedIndex={tableIndex}
				onSelect={setTableIndex}
				onEnter={handleTableSelect}
				focused={focusedPanel === 'sidebar' && sidebarSection === 'tables'}
				maxVisibleItems={tablesHeight}
				flexGrow={1}
				error={error ? getErrorDisplayMessage(error) : undefined}
				isLoading={isLoading}
			/>
		</Box>
	)
}
