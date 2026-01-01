import { Box, Text } from 'ink'
import type { ReactNode } from 'react'
import { useTerminal } from '../../contexts/terminal-context.js'
import { colors, symbols } from '../../theme.js'

export type MainPanelProps = {
	title: string
	panelNumber?: number
	focused?: boolean
	metadata?: ReactNode
	queryFilter?: ReactNode
	footer?: ReactNode
	children: ReactNode
}

/**
 * Main content panel matching SidebarPanel structure.
 * Structure: [N] Title | separator | metadata | query/filter | content | footer
 */
export function MainPanel({
	title,
	panelNumber = 0,
	focused = false,
	metadata,
	queryFilter,
	footer,
	children,
}: MainPanelProps) {
	const { mainWidth } = useTerminal()
	const borderColor = focused ? colors.focus : colors.border

	// Separator fills main panel width minus padding (2) and border (2)
	const separatorWidth = Math.max(10, mainWidth - 4)

	return (
		<Box
			flexDirection="column"
			flexGrow={1}
			borderStyle="round"
			borderColor={borderColor}
			overflowY="hidden"
		>
			{/* Panel header */}
			<Box paddingX={1} gap={2}>
				<Text color={focused ? colors.focus : colors.textMuted}>[{panelNumber}]</Text>
				<Text color={focused ? colors.brand : colors.text} bold>
					{title}
				</Text>
			</Box>

			{/* Separator - full width */}
			<Box paddingX={1}>
				<Text color={borderColor}>{symbols.sectionSeparator.repeat(separatorWidth)}</Text>
			</Box>

			{/* Metadata bar (table info) */}
			{metadata && (
				<Box paddingX={1} gap={1}>
					{metadata}
				</Box>
			)}

			{/* Query/Filter summary (expandable area) */}
			{queryFilter && <Box paddingX={1}>{queryFilter}</Box>}

			{/* Content separator when we have metadata or query/filter - full width */}
			{(metadata || queryFilter) && (
				<Box paddingX={1} marginBottom={1}>
					<Text color={colors.border}>{symbols.headerSeparator.repeat(separatorWidth)}</Text>
				</Box>
			)}

			{/* Main content area */}
			<Box flexDirection="column" paddingX={1} flexGrow={1} overflowY="hidden">
				{children}
			</Box>

			{/* Footer (pagination, position) - full width */}
			{footer && (
				<Box paddingX={1} width="100%">
					{footer}
				</Box>
			)}
		</Box>
	)
}
