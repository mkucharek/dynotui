import { Box, Text, useInput } from 'ink'
import { colors, symbols } from '../../theme.js'

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
				<Text color={colors.textSecondary}>
					Scanned: <Text color={colors.dataValue}>{scannedCount.toLocaleString()}</Text>
				</Text>
			)}
			{hasMore && (
				<Text color={colors.textSecondary}>
					{symbols.hasMore}{' '}
					<Text color={colors.focus} bold>
						n
					</Text>{' '}
					Load more
				</Text>
			)}
			{onRefresh && (
				<Text color={colors.textSecondary}>
					<Text color={colors.focus} bold>
						r
					</Text>{' '}
					Refresh
				</Text>
			)}
			{isLoading && <Text color={colors.brand}>Loading...</Text>}
		</Box>
	)
}
