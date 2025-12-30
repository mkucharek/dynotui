import { Box } from 'ink'
import type { ReactNode } from 'react'

export type SplitLayoutProps = {
	sidebar: ReactNode
	main: ReactNode
	sidebarWidth?: number
	height?: number
}

export function SplitLayout({ sidebar, main, sidebarWidth = 28, height }: SplitLayoutProps) {
	return (
		<Box flexDirection="row" width="100%" height={height} overflowY="hidden">
			{/* Sidebar */}
			<Box
				flexDirection="column"
				width={sidebarWidth}
				flexShrink={0}
				height={height}
				overflowY="hidden"
			>
				{sidebar}
			</Box>

			{/* Main content */}
			<Box
				flexDirection="column"
				flexGrow={1}
				flexShrink={1}
				height={height}
				overflowY="hidden"
				overflow="hidden"
				paddingLeft={1}
			>
				{main}
			</Box>
		</Box>
	)
}
