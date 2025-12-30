import { Box, Text } from 'ink'
import { type InputMode, useAppStore } from '../../store/app-store.js'
import { colors } from '../../theme.js'

export type KeyBinding = {
	key: string
	label: string
}

export type FooterProps = {
	bindings?: KeyBinding[]
}

const modeBindings: Record<InputMode, KeyBinding[]> = {
	normal: [
		{ key: 'j/k', label: 'Navigate' },
		{ key: 'Enter', label: 'View' },
		{ key: 's', label: 'Scan' },
		{ key: 'q', label: 'Query' },
		{ key: 'f', label: 'Filter' },
		{ key: 'n', label: 'Next' },
		{ key: '1/2/0', label: 'Panel' },
		{ key: 'Esc', label: 'Back' },
	],
	'query-form': [
		{ key: 'Tab', label: 'Next field' },
		{ key: 'Enter', label: 'Submit' },
		{ key: 'Esc', label: 'Cancel' },
	],
	'scan-filter': [
		{ key: 'Tab', label: 'Next' },
		{ key: 'S-Tab', label: 'Prev' },
		{ key: '↑↓', label: 'Cycle' },
		{ key: '= ! < >', label: 'Operator' },
		{ key: 'Enter', label: 'Apply' },
		{ key: 'Esc', label: 'Cancel' },
	],
	'item-detail': [
		{ key: 'j/k', label: 'Scroll' },
		{ key: 'g/G', label: 'Top/Bottom' },
		{ key: 'y', label: 'Copy JSON' },
		{ key: '1/2/0', label: 'Panel' },
		{ key: 'Esc', label: 'Back' },
	],
	sidebar: [
		{ key: 'j/k', label: 'Navigate' },
		{ key: 'h/l', label: 'Tab' },
		{ key: 'Enter', label: 'Select' },
		{ key: '1/2/0', label: 'Panel' },
		{ key: 'q', label: 'Quit' },
	],
}

export function Footer({ bindings }: FooterProps) {
	const { inputMode } = useAppStore()

	const effectiveBindings = bindings ?? modeBindings[inputMode] ?? modeBindings.sidebar

	return (
		<Box paddingX={1} gap={3}>
			{effectiveBindings.map(({ key, label }, idx) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static binding list
				<Text key={idx}>
					<Text color={colors.focus} bold>
						{key}
					</Text>
					<Text color={colors.textSecondary}> {label}</Text>
				</Text>
			))}
		</Box>
	)
}
