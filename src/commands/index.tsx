import { Box, Text } from 'ink'

export default function Index() {
	return (
		<Box flexDirection="column" padding={1}>
			<Text bold color="cyan">
				DynoTUI
			</Text>
			<Text dimColor>DynamoDB TUI client</Text>
		</Box>
	)
}
