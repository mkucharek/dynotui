import { Box, Text, useInput } from 'ink'

export type PaginationProps = {
	hasMore: boolean
	isLoading: boolean
	scannedCount?: number
	onNextPage: () => void
	onRefresh?: () => void
	focused?: boolean
}

export function Pagination({
	hasMore,
	isLoading,
	scannedCount,
	onNextPage,
	onRefresh,
	focused = true,
}: PaginationProps) {
	useInput(
		(input) => {
			if (!focused) return

			if (input === 'n' && hasMore && !isLoading) {
				onNextPage()
			} else if (input === 'r' && onRefresh && !isLoading) {
				onRefresh()
			}
		},
		{ isActive: focused },
	)

	return (
		<Box gap={2}>
			{scannedCount !== undefined && (
				<Text dimColor>
					Scanned: <Text color="yellow">{scannedCount}</Text>
				</Text>
			)}
			{hasMore && (
				<Text dimColor>
					<Text color="cyan" bold>
						n
					</Text>{' '}
					Load more
				</Text>
			)}
			{onRefresh && (
				<Text dimColor>
					<Text color="cyan" bold>
						r
					</Text>{' '}
					Refresh
				</Text>
			)}
			{isLoading && <Text color="yellow">Loading...</Text>}
		</Box>
	)
}
