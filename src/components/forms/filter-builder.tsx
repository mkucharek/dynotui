import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { useState } from 'react'
import type { FilterCondition, FilterOperator } from '../../schemas/query-params.js'

export type FilterBuilderProps = {
	conditions: FilterCondition[]
	onChange: (conditions: FilterCondition[]) => void
	focused?: boolean
	onExit?: () => void
}

type FieldType = 'attribute' | 'operator' | 'value' | 'value2'

type ActiveField = {
	conditionIndex: number
	field: FieldType
}

const FILTER_OPERATORS: {
	value: FilterOperator
	label: string
	needsValue: boolean
	needsValue2: boolean
}[] = [
	{ value: 'eq', label: '=', needsValue: true, needsValue2: false },
	{ value: 'ne', label: '<>', needsValue: true, needsValue2: false },
	{ value: 'lt', label: '<', needsValue: true, needsValue2: false },
	{ value: 'lte', label: '<=', needsValue: true, needsValue2: false },
	{ value: 'gt', label: '>', needsValue: true, needsValue2: false },
	{ value: 'gte', label: '>=', needsValue: true, needsValue2: false },
	{ value: 'between', label: 'between', needsValue: true, needsValue2: true },
	{ value: 'begins_with', label: 'begins_with', needsValue: true, needsValue2: false },
	{ value: 'contains', label: 'contains', needsValue: true, needsValue2: false },
	{ value: 'attribute_exists', label: 'exists', needsValue: false, needsValue2: false },
	{ value: 'attribute_not_exists', label: 'not exists', needsValue: false, needsValue2: false },
]

function parseValue(value: string): string | number {
	const trimmed = value.trim()
	if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
		const num = Number(trimmed)
		if (!Number.isNaN(num)) return num
	}
	return trimmed
}

function valueToString(value: string | number | boolean | undefined): string {
	if (value === undefined) return ''
	return String(value)
}

function createEmptyCondition(): FilterCondition {
	return { attribute: '', operator: 'eq', value: '' }
}

export function FilterBuilder({
	conditions,
	onChange,
	focused = true,
	onExit,
}: FilterBuilderProps) {
	const [activeField, setActiveField] = useState<ActiveField | null>(
		conditions.length > 0 ? { conditionIndex: 0, field: 'attribute' } : null,
	)
	const [operatorIndices, setOperatorIndices] = useState<number[]>(
		conditions.map((c) => FILTER_OPERATORS.findIndex((op) => op.value === c.operator)),
	)

	const getFieldsForCondition = (index: number): FieldType[] => {
		const op = FILTER_OPERATORS.find((o) => o.value === conditions[index]?.operator)
		const fields: FieldType[] = ['attribute', 'operator']
		if (op?.needsValue) fields.push('value')
		if (op?.needsValue2) fields.push('value2')
		return fields
	}

	const handleAddCondition = () => {
		const newConditions = [...conditions, createEmptyCondition()]
		onChange(newConditions)
		setOperatorIndices([...operatorIndices, 0])
		setActiveField({ conditionIndex: newConditions.length - 1, field: 'attribute' })
	}

	const handleRemoveCondition = (index: number) => {
		if (conditions.length <= 1) return
		const newConditions = conditions.filter((_, i) => i !== index)
		const newOpIndices = operatorIndices.filter((_, i) => i !== index)
		onChange(newConditions)
		setOperatorIndices(newOpIndices)
		if (activeField && activeField.conditionIndex >= newConditions.length) {
			setActiveField({ conditionIndex: Math.max(0, newConditions.length - 1), field: 'attribute' })
		}
	}

	const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
		const current = conditions[index]
		if (!current) return
		const newConditions = [...conditions]
		newConditions[index] = {
			attribute: updates.attribute ?? current.attribute,
			operator: updates.operator ?? current.operator,
			value: updates.value !== undefined ? updates.value : current.value,
			value2: updates.value2 !== undefined ? updates.value2 : current.value2,
		}
		onChange(newConditions)
	}

	useInput(
		(input, key) => {
			if (!focused) return

			if (key.escape) {
				onExit?.()
				return
			}

			// Add new filter with 'a' when not in text input
			if (input === 'a' && activeField?.field === 'operator') {
				handleAddCondition()
				return
			}

			// Remove filter with 'd' when on operator field
			if (input === 'd' && activeField?.field === 'operator' && conditions.length > 1) {
				handleRemoveCondition(activeField.conditionIndex)
				return
			}

			// Navigate operator with j/k
			if (activeField?.field === 'operator') {
				const idx = activeField.conditionIndex
				const opIdx = operatorIndices[idx] ?? 0

				if (input === 'j' || key.downArrow) {
					const newOpIdx = (opIdx + 1) % FILTER_OPERATORS.length
					const newOp = FILTER_OPERATORS[newOpIdx]
					if (!newOp) return
					const newOpIndices = [...operatorIndices]
					newOpIndices[idx] = newOpIdx
					setOperatorIndices(newOpIndices)
					updateCondition(idx, { operator: newOp.value })
					return
				}
				if (input === 'k' || key.upArrow) {
					const newOpIdx = (opIdx - 1 + FILTER_OPERATORS.length) % FILTER_OPERATORS.length
					const newOp = FILTER_OPERATORS[newOpIdx]
					if (!newOp) return
					const newOpIndices = [...operatorIndices]
					newOpIndices[idx] = newOpIdx
					setOperatorIndices(newOpIndices)
					updateCondition(idx, { operator: newOp.value })
					return
				}
			}

			// Tab to next field
			if (key.tab || key.return) {
				if (!activeField) {
					if (conditions.length > 0) {
						setActiveField({ conditionIndex: 0, field: 'attribute' })
					}
					return
				}

				const fields = getFieldsForCondition(activeField.conditionIndex)
				const currentFieldIndex = fields.indexOf(activeField.field)
				const nextFieldIndex = currentFieldIndex + 1
				const nextField = fields[nextFieldIndex]

				if (nextField) {
					setActiveField({ ...activeField, field: nextField })
				} else if (activeField.conditionIndex < conditions.length - 1) {
					// Move to next condition
					setActiveField({ conditionIndex: activeField.conditionIndex + 1, field: 'attribute' })
				} else {
					// We're at the last field of the last condition - exit or cycle
					onExit?.()
				}
			}
		},
		{ isActive: focused },
	)

	if (conditions.length === 0) {
		return (
			<Box flexDirection="column">
				<Text dimColor>No filters. Press Tab to add one.</Text>
			</Box>
		)
	}

	return (
		<Box flexDirection="column" gap={0}>
			<Box marginBottom={1}>
				<Text bold color="cyan">
					Filters
				</Text>
				<Text dimColor> ({conditions.length})</Text>
			</Box>

			{conditions.map((condition, idx) => {
				const opIdx = operatorIndices[idx] ?? 0
				const op = FILTER_OPERATORS[opIdx] ?? FILTER_OPERATORS[0]
				const isActiveCondition = activeField?.conditionIndex === idx

				return (
					<Box key={idx} gap={1}>
						<Text dimColor>{idx + 1}.</Text>

						{/* Attribute */}
						<Box width={15}>
							{isActiveCondition && activeField.field === 'attribute' ? (
								<TextInput
									value={condition.attribute}
									onChange={(val) => updateCondition(idx, { attribute: val })}
									focus={focused}
									placeholder="attribute"
								/>
							) : (
								<Text color={condition.attribute ? undefined : 'gray'}>
									{condition.attribute || 'attribute'}
								</Text>
							)}
						</Box>

						{/* Operator */}
						<Box width={12}>
							{isActiveCondition && activeField.field === 'operator' ? (
								<Text color="cyan">[{op?.label ?? '='}]</Text>
							) : (
								<Text color="gray">{op?.label ?? '='}</Text>
							)}
						</Box>

						{/* Value */}
						{op?.needsValue && (
							<Box width={15}>
								{isActiveCondition && activeField.field === 'value' ? (
									<TextInput
										value={valueToString(condition.value)}
										onChange={(val) => updateCondition(idx, { value: parseValue(val) })}
										focus={focused}
										placeholder="value"
									/>
								) : (
									<Text
										color={
											condition.value !== undefined && condition.value !== '' ? undefined : 'gray'
										}
									>
										{valueToString(condition.value) || 'value'}
									</Text>
								)}
							</Box>
						)}

						{/* Value2 (for between) */}
						{op?.needsValue2 && (
							<>
								<Text dimColor>-</Text>
								<Box width={15}>
									{isActiveCondition && activeField.field === 'value2' ? (
										<TextInput
											value={valueToString(condition.value2)}
											onChange={(val) => updateCondition(idx, { value2: parseValue(val) })}
											focus={focused}
											placeholder="value2"
										/>
									) : (
										<Text
											color={
												condition.value2 !== undefined && condition.value2 !== ''
													? undefined
													: 'gray'
											}
										>
											{valueToString(condition.value2) || 'value2'}
										</Text>
									)}
								</Box>
							</>
						)}
					</Box>
				)
			})}

			<Box marginTop={1}>
				<Text dimColor>
					<Text color="cyan">j/k</Text> operator {'  '}
					<Text color="cyan">Tab</Text> next {'  '}
					<Text color="cyan">a</Text> add {'  '}
					{conditions.length > 1 && (
						<>
							<Text color="cyan">d</Text> remove
						</>
					)}
				</Text>
			</Box>
		</Box>
	)
}
