import { Box, Text } from 'ink'
import type { ReactNode } from 'react'
import { useTerminal } from '../../contexts/terminal-context.js'
import { colors, symbols } from '../../theme.js'

export type TabDef = {
	id: string
	label: string
}

export type SidebarPanelProps = {
	tabs: TabDef[]
	activeTab: string
	panelNumber?: number
	focused?: boolean
	height?: number
	flexGrow?: number
	children: ReactNode
}

export function SidebarPanel({
	tabs,
	activeTab,
	panelNumber,
	focused = false,
	height,
	flexGrow,
	children,
}: SidebarPanelProps) {
	const { sidebarWidth } = useTerminal()
	const borderColor = focused ? colors.focus : colors.border
	// Separator fills sidebar width minus padding (2) and border (2)
	const separatorWidth = Math.max(10, sidebarWidth - 4)

	return (
		<Box
			flexDirection="column"
			height={height}
			flexGrow={flexGrow}
			borderStyle="round"
			borderColor={borderColor}
			overflowY="hidden"
		>
			{/* Tab header */}
			<Box paddingX={1} gap={2}>
				{panelNumber !== undefined && (
					<Text color={focused ? colors.focus : colors.textMuted}>[{panelNumber}]</Text>
				)}
				{tabs.map((tab) => {
					const isActive = tab.id === activeTab
					return (
						<Text key={tab.id}>
							<Text
								color={isActive ? colors.brand : colors.textSecondary}
								bold={isActive}
								underline={isActive}
							>
								{tab.label}
							</Text>
						</Text>
					)
				})}
			</Box>

			{/* Separator */}
			<Box paddingX={1}>
				<Text color={borderColor}>{symbols.sectionSeparator.repeat(separatorWidth)}</Text>
			</Box>

			{/* Content */}
			<Box flexDirection="column" paddingX={1} flexGrow={1} overflowY="hidden">
				{children}
			</Box>
		</Box>
	)
}
