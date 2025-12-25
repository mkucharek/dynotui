import { Box, Text } from 'ink'
import { useAppStore } from '../../store/app-store.js'

export function Header() {
	const { profile, region } = useAppStore()

	return (
		<Box
			borderStyle="single"
			borderBottom={true}
			borderTop={false}
			borderLeft={false}
			borderRight={false}
			paddingX={1}
			justifyContent="space-between"
		>
			<Text bold color="cyan">
				DynoTUI
			</Text>
			<Box gap={2}>
				<Text dimColor>
					Profile: <Text color="yellow">{profile ?? 'default'}</Text>
				</Text>
				<Text dimColor>
					Region: <Text color="yellow">{region}</Text>
				</Text>
			</Box>
		</Box>
	)
}
