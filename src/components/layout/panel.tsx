import { Box, type BoxProps, Text } from 'ink'
import type { ReactNode } from 'react'
import { borders, colors } from '../../theme.js'

export type PanelProps = {
	title?: ReactNode
	children: ReactNode
	focused?: boolean
} & Omit<BoxProps, 'borderStyle' | 'borderColor'>

export function Panel({ title, children, focused = false, ...boxProps }: PanelProps) {
	const borderColor = focused ? borders.focusedColor : borders.unfocusedColor

	return (
		<Box flexDirection="column" {...boxProps}>
			{title && (
				<Box marginBottom={-1} marginLeft={2}>
					{typeof title === 'string' ? (
						<Text bold color={focused ? colors.focus : colors.textSecondary}>
							{' '}
							{title}{' '}
						</Text>
					) : (
						<Text> {title} </Text>
					)}
				</Box>
			)}
			<Box
				flexDirection="column"
				borderStyle={borders.style}
				borderColor={borderColor}
				overflowY="hidden"
				flexGrow={1}
			>
				<Box flexDirection="column" paddingX={1} overflowY="hidden" flexGrow={1}>
					{children}
				</Box>
			</Box>
		</Box>
	)
}
