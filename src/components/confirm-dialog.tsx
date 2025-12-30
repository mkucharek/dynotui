import { ConfirmInput } from '@inkjs/ui'
import { Box, Text } from 'ink'
import { colors } from '../theme.js'

export type ConfirmDialogProps = {
	message: string
	visible: boolean
	onConfirm: () => void
	onCancel: () => void
}

export function ConfirmDialog({ message, visible, onConfirm, onCancel }: ConfirmDialogProps) {
	if (!visible) return null

	return (
		<Box flexGrow={1} alignItems="center" justifyContent="center">
			<Box
				flexDirection="column"
				borderStyle="round"
				borderColor={colors.brand}
				paddingX={2}
				paddingY={1}
			>
				<Box marginBottom={1}>
					<Text color={colors.brand} bold>
						⚠ Confirm
					</Text>
				</Box>
				<Box gap={1}>
					<Text>{message}</Text>
					<ConfirmInput onConfirm={onConfirm} onCancel={onCancel} />
				</Box>
			</Box>
		</Box>
	)
}
