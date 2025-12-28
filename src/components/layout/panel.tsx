import { Box, type BoxProps, Text } from 'ink'
import type { ReactNode } from 'react'

export type PanelProps = {
	title?: ReactNode
	children: ReactNode
	focused?: boolean
} & Omit<BoxProps, 'borderStyle' | 'borderColor'>

export function Panel({ title, children, focused = false, ...boxProps }: PanelProps) {
	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor={focused ? 'cyan' : undefined}
			{...boxProps}
		>
			{title && (
				<Box marginTop={-1} marginLeft={1}>
					{typeof title === 'string' ? (
						<Text bold color={focused ? 'cyan' : undefined}>
							{' '}
							{title}{' '}
						</Text>
					) : (
						<Text> {title} </Text>
					)}
				</Box>
			)}
			<Box flexDirection="column" paddingX={1}>
				{children}
			</Box>
		</Box>
	)
}
