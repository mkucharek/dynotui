import { Box, Text } from 'ink'
import { useAppStore } from '../../store/app-store.js'
import { colors, symbols } from '../../theme.js'

export type HeaderProps = {
	connected?: boolean
}

export function Header({ connected = true }: HeaderProps) {
	const { profile, region, currentView } = useAppStore()

	const connectionIndicator = connected ? symbols.connected : symbols.disconnected
	const connectionColor = connected ? colors.active : colors.error

	// Build breadcrumb parts with colors
	const breadcrumbParts: Array<{ text: string; color: string }> = [
		{ text: profile ?? 'default', color: colors.brand },
		{ text: region, color: colors.textSecondary },
	]
	if (currentView.view === 'table') {
		breadcrumbParts.push({ text: currentView.tableName, color: colors.text })
		breadcrumbParts.push({ text: currentView.mode, color: colors.focus })
	} else if (currentView.view === 'item') {
		breadcrumbParts.push({ text: currentView.tableName, color: colors.text })
		breadcrumbParts.push({ text: 'item', color: colors.focus })
	}

	return (
		<Box paddingX={1} justifyContent="space-between">
			{/* Left: Brand */}
			<Box gap={1}>
				<Text color={colors.brand}>{symbols.brandMark}</Text>
				<Text bold color={colors.brand}>
					DynoTUI
				</Text>
			</Box>

			{/* Center: Breadcrumb */}
			<Box>
				{breadcrumbParts.map((part, idx) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static breadcrumb
					<Text key={idx}>
						<Text color={part.color}>{part.text}</Text>
						{idx < breadcrumbParts.length - 1 && (
							<Text color={colors.textMuted}> {symbols.breadcrumbSeparator} </Text>
						)}
					</Text>
				))}
			</Box>

			{/* Right: Connection indicator */}
			<Text color={connectionColor}>{connectionIndicator}</Text>
		</Box>
	)
}
