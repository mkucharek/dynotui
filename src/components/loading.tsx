import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import { colors } from '../theme.js'

export type LoadingProps = {
	message?: string
	detail?: string
}

export function Loading({ message = 'Loading...', detail }: LoadingProps) {
	return (
		<Box flexDirection="column">
			<Text>
				<Text color={colors.focus}>
					<Spinner type="dots" />
				</Text>{' '}
				<Text color={colors.text}>{message}</Text>
			</Text>
			{detail && <Text color={colors.textMuted}> {detail}</Text>}
		</Box>
	)
}
