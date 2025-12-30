import { Box, useInput } from 'ink'
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
		initialConditions && initialConditions.length > 0
			? initialConditions
			: [createEmptyCondition()],
	)

	const handleSubmit = () => {
		// Only include valid filters (with attribute name)
		const validFilters = conditions.filter((f) => f.attribute.trim() !== '')
		onSubmit(validFilters)
	}

	const handleClear = () => {
		// All filters cleared - submit empty to clear and go back to raw scan
		onSubmit([])
	}

	useInput(
		(_input, key) => {
			if (!focused) return

			if (key.escape) {
				onCancel()
			}
		},
		{ isActive: focused },
	)

	return (
		<Box flexDirection="column" gap={1}>
			<FilterBuilder
				conditions={conditions}
				onChange={setConditions}
				focused={focused}
				onExit={handleSubmit}
				onClear={handleClear}
			/>
		</Box>
	)
}
