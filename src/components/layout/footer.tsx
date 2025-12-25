import { Box, Text } from 'ink'

export type KeyBinding = {
	key: string
	label: string
}

export type FooterProps = {
	bindings?: KeyBinding[]
}

const defaultBindings: KeyBinding[] = [
	{ key: 'q', label: 'Quit' },
	{ key: 'Esc', label: 'Back' },
	{ key: '?', label: 'Help' },
]

export function Footer({ bindings = defaultBindings }: FooterProps) {
	return (
		<Box
			borderStyle="single"
			borderTop={true}
			borderBottom={false}
			borderLeft={false}
			borderRight={false}
			paddingX={1}
			gap={2}
		>
			{bindings.map(({ key, label }) => (
				<Text key={key} dimColor>
					<Text color="cyan" bold>
						{key}
					</Text>{' '}
					{label}
				</Text>
			))}
		</Box>
	)
}
