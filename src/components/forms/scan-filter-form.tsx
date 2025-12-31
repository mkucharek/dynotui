import { Box } from 'ink'
import { useState } from 'react'
import type { FilterCondition } from '../../schemas/query-params.js'
import { FilterBuilder } from './filter-builder.js'

export type ScanFilterFormProps = {
	initialConditions?: FilterCondition[]
	onSubmit: (conditions: FilterCondition[]) => void
	onCancel: () => void
	focused?: boolean
	availableAttributes?: string[]
}

function createEmptyCondition(): FilterCondition {
	return { attribute: '', operator: 'eq', value: '' }
}

export function ScanFilterForm({
	initialConditions,
	onSubmit,
	onCancel,
	focused = true,
	availableAttributes = [],
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

	return (
		<Box flexDirection="column" gap={1}>
			<FilterBuilder
				conditions={conditions}
				onChange={setConditions}
				focused={focused}
				onExit={handleSubmit}
				onCancel={onCancel}
				onClear={handleClear}
				availableAttributes={availableAttributes}
			/>
		</Box>
	)
}
