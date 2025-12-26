import { Box, Text, useInput } from 'ink'
import { useState } from 'react'
import type { FilterCondition } from '../../schemas/query-params.js'
import { FilterBuilder } from './filter-builder.js'

export type ScanFilterFormProps = {
	initialConditions?: FilterCondition[]
	onSubmit: (conditions: FilterCondition[]) => void
	onCancel: () => void
	focused?: boolean
}

function createEmptyCondition(): FilterCondition {
	return { attribute: '', operator: 'eq', value: '' }
}

export function ScanFilterForm({
	initialConditions,
	onSubmit,
	onCancel,
	focused = true,
}: ScanFilterFormProps) {
	const [conditions, setConditions] = useState<FilterCondition[]>(
		initialConditions && initialConditions.length > 0 ? initialConditions : [createEmptyCondition()],
	)

	const handleSubmit = () => {
		// Only include valid filters (with attribute name)
		const validFilters = conditions.filter((f) => f.attribute.trim() !== '')
		onSubmit(validFilters)
	}

	useInput(
		(input, key) => {
			if (!focused) return

			if (key.escape) {
				onCancel()
			}
		},
		{ isActive: focused },
	)

	return (
		<Box flexDirection="column" gap={1}>
			<Box>
				<Text bold color="cyan">
					Scan Filter
				</Text>
			</Box>

			<FilterBuilder
				conditions={conditions}
				onChange={setConditions}
				focused={focused}
				onExit={handleSubmit}
			/>

			<Box marginTop={1}>
				<Text dimColor>
					<Text color="cyan">Tab</Text> Next {'  '}
					<Text color="cyan">Enter</Text> Apply {'  '}
					<Text color="cyan">Esc</Text> Cancel
				</Text>
			</Box>
		</Box>
	)
}
