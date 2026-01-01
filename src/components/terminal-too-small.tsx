import { Box, Text } from 'ink'
import { TERMINAL } from '../constants/terminal.js'
import { colors } from '../theme.js'

export type TerminalTooSmallProps = {
	width: number
	height: number
}

/**
 * Fallback component shown when terminal is below minimum usable size.
 */
export function TerminalTooSmall({ width, height }: TerminalTooSmallProps) {
	return (
		<Box
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			width={width}
			height={height}
		>
			<Text color={colors.error} bold>
				Terminal too small
			</Text>
			<Text color={colors.textMuted}>
				Current: {width}x{height}
			</Text>
			<Text color={colors.textMuted}>
				Required: {TERMINAL.MIN_WIDTH}x{TERMINAL.MIN_HEIGHT}
			</Text>
		</Box>
	)
}
