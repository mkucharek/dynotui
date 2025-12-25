import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { useState } from 'react'

export type FilterInputProps = {
	onSubmit: (filterExpression: string) => void
	onCancel: () => void
	focused?: boolean
}

export function FilterInput({ onSubmit, onCancel, focused = true }: FilterInputProps) {
	const [value, setValue] = useState('')

	useInput(
		(_input, key) => {
			if (!focused) return

			if (key.escape) {
				onCancel()
			} else if (key.return) {
				onSubmit(value)
			}
		},
		{ isActive: focused },
	)

	return (
		<Box flexDirection="column" gap={1}>
			<Box>
				<Text bold color="cyan">
					Filter Expression
				</Text>
			</Box>

			<Box>
				<Box width={12}>
					<Text>Filter:</Text>
				</Box>
				<TextInput
					value={value}
					onChange={setValue}
					focus={focused}
					placeholder="e.g., attribute_exists(email)"
				/>
			</Box>

			<Box marginTop={1}>
				<Text dimColor>
					<Text color="cyan">Enter</Text> Apply {'  '}
					<Text color="cyan">Esc</Text> Cancel
				</Text>
			</Box>
		</Box>
	)
}
