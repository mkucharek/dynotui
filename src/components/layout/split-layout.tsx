import { Box } from 'ink'
import type { ReactNode } from 'react'

export type SplitLayoutProps = {
	sidebar: ReactNode
	main: ReactNode
	sidebarWidth?: number
	height?: number
}

export function SplitLayout({ sidebar, main, sidebarWidth = 30, height }: SplitLayoutProps) {
	return (
		<Box flexDirection="row" width="100%" height={height} overflowY="hidden">
			<Box
				flexDirection="column"
				width={sidebarWidth}
				height={height}
				borderStyle="single"
				borderRight={true}
				borderTop={false}
				borderBottom={false}
				borderLeft={false}
				overflowY="hidden"
			>
				{sidebar}
			</Box>
			<Box flexDirection="column" flexGrow={1} height={height} overflowY="hidden">
				{main}
			</Box>
		</Box>
	)
}
