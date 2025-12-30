import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { useEffect, useRef, useState } from 'react'
import type { FilterCondition, FilterOperator } from '../../schemas/query-params.js'
import { colors } from '../../theme.js'

export type FilterBuilderProps = {
	conditions: FilterCondition[]
	onChange: (conditions: FilterCondition[]) => void
	focused?: boolean
	onExit?: () => void
	onClear?: () => void // Called when all filters are cleared
}

type FieldType = 'attribute' | 'operator' | 'value' | 'value2' | 'delete'

type ActiveField =
	| { type: 'field'; conditionIndex: number; field: FieldType }
	| { type: 'add' }
	| { type: 'clear' }

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
	onClear,
}: FilterBuilderProps) {
	const idCounter = useRef(conditions.length)
	const [conditionIds, setConditionIds] = useState<number[]>(() => conditions.map((_, i) => i))
	const [activeField, setActiveField] = useState<ActiveField>(
		conditions.length > 0
			? { type: 'field', conditionIndex: 0, field: 'attribute' }
			: { type: 'add' },
	)
	const [operatorIndices, setOperatorIndices] = useState<number[]>(
		conditions.map((c) => FILTER_OPERATORS.findIndex((op) => op.value === c.operator)),
	)

	// Sync local state when conditions prop changes externally
	useEffect(() => {
		setConditionIds((prev) => {
			if (prev.length === conditions.length) return prev
			// Reset IDs when length changes
			const newIds = conditions.map((_, i) => idCounter.current + i)
			idCounter.current += conditions.length
			return newIds
		})
		setOperatorIndices(
			conditions.map((c) => FILTER_OPERATORS.findIndex((op) => op.value === c.operator)),
		)
		// Reset focus if current index is out of bounds
		if (activeField?.type === 'field' && activeField.conditionIndex >= conditions.length) {
			setActiveField(
				conditions.length > 0
					? { type: 'field', conditionIndex: 0, field: 'attribute' }
					: { type: 'add' },
			)
		}
	}, [conditions, activeField])

	const getFieldsForCondition = (index: number): FieldType[] => {
		const op = FILTER_OPERATORS.find((o) => o.value === conditions[index]?.operator)
		const fields: FieldType[] = ['attribute', 'operator']
		if (op?.needsValue) fields.push('value')
		if (op?.needsValue2) fields.push('value2')
		fields.push('delete') // Always add delete button
		return fields
	}

	const handleAddCondition = () => {
		const newConditions = [...conditions, createEmptyCondition()]
		onChange(newConditions)
		setOperatorIndices([...operatorIndices, 0])
		const newId = idCounter.current++
		setConditionIds([...conditionIds, newId])
		setActiveField({ type: 'field', conditionIndex: newConditions.length - 1, field: 'attribute' })
	}

	const handleRemoveCondition = (index: number) => {
		if (conditions.length <= 1) {
			// Last filter - clear all and exit
			handleClearAll()
			return
		}
		const newConditions = conditions.filter((_, i) => i !== index)
		const newOpIndices = operatorIndices.filter((_, i) => i !== index)
		const newIds = conditionIds.filter((_, i) => i !== index)
		onChange(newConditions)
		setOperatorIndices(newOpIndices)
		setConditionIds(newIds)
		if (activeField?.type === 'field' && activeField.conditionIndex >= newConditions.length) {
			setActiveField({
				type: 'field',
				conditionIndex: Math.max(0, newConditions.length - 1),
				field: 'attribute',
			})
		}
	}

	const handleClearAll = () => {
		onChange([])
		onClear?.()
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

			// Handle Clear button focus
			if (activeField?.type === 'clear') {
				if (key.return || input === ' ') {
					handleClearAll()
					return
				}
				if (key.tab) {
					// Tab from Clear loops back to first condition
					if (conditions.length > 0) {
						setActiveField({ type: 'field', conditionIndex: 0, field: 'attribute' })
					} else {
						setActiveField({ type: 'add' })
					}
					return
				}
				// Left arrow goes to Add button
				if (key.leftArrow) {
					setActiveField({ type: 'add' })
					return
				}
				// Up arrow goes to last filter row
				if (key.upArrow && conditions.length > 0) {
					setActiveField({
						type: 'field',
						conditionIndex: conditions.length - 1,
						field: 'attribute',
					})
					return
				}
				return
			}

			// Handle Add button focus
			if (activeField?.type === 'add') {
				if (key.return || input === ' ') {
					handleAddCondition()
					return
				}
				if (key.tab || key.rightArrow) {
					// Tab/Right from Add goes to Clear (if filters exist)
					if (conditions.length > 0) {
						setActiveField({ type: 'clear' })
					}
					return
				}
				// Left arrow goes to last row's delete button
				if (key.leftArrow && conditions.length > 0) {
					setActiveField({
						type: 'field',
						conditionIndex: conditions.length - 1,
						field: 'delete',
					})
					return
				}
				// Up arrow goes to last filter row
				if (key.upArrow && conditions.length > 0) {
					setActiveField({
						type: 'field',
						conditionIndex: conditions.length - 1,
						field: 'attribute',
					})
					return
				}
				return
			}

			// Handle field focus
			if (activeField?.type === 'field') {
				const { conditionIndex, field } = activeField

				// Delete button action
				if (field === 'delete' && (key.return || input === ' ')) {
					handleRemoveCondition(conditionIndex)
					return
				}

				// Navigate operator with j/k or arrows (cycles through operators)
				if (field === 'operator') {
					const opIdx = operatorIndices[conditionIndex] ?? 0

					if (input === 'j' || key.downArrow) {
						const newOpIdx = (opIdx + 1) % FILTER_OPERATORS.length
						const newOp = FILTER_OPERATORS[newOpIdx]
						if (!newOp) return
						const newOpIndices = [...operatorIndices]
						newOpIndices[conditionIndex] = newOpIdx
						setOperatorIndices(newOpIndices)
						updateCondition(conditionIndex, { operator: newOp.value })
						return
					}
					if (input === 'k' || key.upArrow) {
						const newOpIdx = (opIdx - 1 + FILTER_OPERATORS.length) % FILTER_OPERATORS.length
						const newOp = FILTER_OPERATORS[newOpIdx]
						if (!newOp) return
						const newOpIndices = [...operatorIndices]
						newOpIndices[conditionIndex] = newOpIdx
						setOperatorIndices(newOpIndices)
						updateCondition(conditionIndex, { operator: newOp.value })
						return
					}
				}

				// Up/Down to move between rows (except on operator which cycles values)
				if (field !== 'operator') {
					if (key.downArrow) {
						if (conditionIndex < conditions.length - 1) {
							// Move to next row, same field (or closest available)
							const nextFields = getFieldsForCondition(conditionIndex + 1)
							const targetField = nextFields.includes(field) ? field : 'attribute'
							setActiveField({
								type: 'field',
								conditionIndex: conditionIndex + 1,
								field: targetField,
							})
						} else {
							// At last row, go to Add button
							setActiveField({ type: 'add' })
						}
						return
					}
					if (key.upArrow) {
						if (conditionIndex > 0) {
							// Move to previous row, same field (or closest available)
							const prevFields = getFieldsForCondition(conditionIndex - 1)
							const targetField = prevFields.includes(field) ? field : 'attribute'
							setActiveField({
								type: 'field',
								conditionIndex: conditionIndex - 1,
								field: targetField,
							})
						}
						return
					}
				}

				// Left/Right to move between fields (only on non-text fields: operator, delete)
				// Text fields (attribute, value, value2) need left/right for cursor movement
				if (field === 'operator' || field === 'delete') {
					const fields = getFieldsForCondition(conditionIndex)
					const currentFieldIndex = fields.indexOf(field)

					if (key.leftArrow && currentFieldIndex > 0) {
						const prevField = fields[currentFieldIndex - 1]
						if (prevField) {
							setActiveField({ type: 'field', conditionIndex, field: prevField })
						}
						return
					}
					if (key.rightArrow) {
						const nextField = fields[currentFieldIndex + 1]
						if (nextField) {
							setActiveField({ type: 'field', conditionIndex, field: nextField })
						} else if (conditionIndex < conditions.length - 1) {
							// Move to next row's first field
							setActiveField({
								type: 'field',
								conditionIndex: conditionIndex + 1,
								field: 'attribute',
							})
						} else {
							// At last field of last row, go to Add button
							setActiveField({ type: 'add' })
						}
						return
					}
				}

				// Tab to next field
				if (key.tab) {
					const fields = getFieldsForCondition(conditionIndex)
					const currentFieldIndex = fields.indexOf(field)
					const nextFieldIndex = currentFieldIndex + 1
					const nextField = fields[nextFieldIndex]

					if (nextField) {
						setActiveField({ type: 'field', conditionIndex, field: nextField })
					} else if (conditionIndex < conditions.length - 1) {
						// Move to next condition
						setActiveField({
							type: 'field',
							conditionIndex: conditionIndex + 1,
							field: 'attribute',
						})
					} else {
						// Move to Add button
						setActiveField({ type: 'add' })
					}
					return
				}

				// Enter submits the form (except on delete button)
				if (key.return && field !== 'delete') {
					onExit?.()
				}
			}
		},
		{ isActive: focused },
	)

	if (conditions.length === 0) {
		return (
			<Box flexDirection="column" gap={1}>
				<Text color={colors.textMuted}>No filters configured.</Text>
				<Box>
					<Text
						color={activeField?.type === 'add' ? colors.focus : colors.textMuted}
						bold={activeField?.type === 'add'}
					>
						{activeField?.type === 'add' ? '[+ Add filter]' : ' + Add filter '}
					</Text>
				</Box>
			</Box>
		)
	}

	return (
		<Box flexDirection="column" gap={0}>
			<Box marginBottom={1}>
				<Text bold color={colors.focus}>
					Filters
				</Text>
				<Text color={colors.textMuted}> ({conditions.length})</Text>
			</Box>

			{conditions.map((condition, idx) => {
				const opIdx = operatorIndices[idx] ?? 0
				const op = FILTER_OPERATORS[opIdx] ?? FILTER_OPERATORS[0]
				const isActiveCondition =
					activeField?.type === 'field' && activeField.conditionIndex === idx
				const activeFieldType = isActiveCondition ? activeField.field : null
				const conditionId = conditionIds[idx] ?? idx

				return (
					<Box key={conditionId} gap={1}>
						<Text color={colors.textMuted}>{idx + 1}.</Text>

						{/* Attribute */}
						<Box width={15}>
							{activeFieldType === 'attribute' ? (
								<TextInput
									value={condition.attribute}
									onChange={(val) => updateCondition(idx, { attribute: val })}
									focus={focused}
									placeholder="attribute"
								/>
							) : (
								<Text color={condition.attribute ? colors.dataKey : colors.textMuted}>
									{condition.attribute || 'attribute'}
								</Text>
							)}
						</Box>

						{/* Operator */}
						<Box width={12}>
							{activeFieldType === 'operator' ? (
								<Text color={colors.focus}>[{op?.label ?? '='}]</Text>
							) : (
								<Text color={colors.textMuted}>{op?.label ?? '='}</Text>
							)}
						</Box>

						{/* Value */}
						{op?.needsValue && (
							<Box width={15}>
								{activeFieldType === 'value' ? (
									<TextInput
										value={valueToString(condition.value)}
										onChange={(val) => updateCondition(idx, { value: parseValue(val) })}
										focus={focused}
										placeholder="value"
									/>
								) : (
									<Text
										color={
											condition.value !== undefined && condition.value !== ''
												? colors.dataValue
												: colors.textMuted
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
								<Text color={colors.textMuted}>-</Text>
								<Box width={15}>
									{activeFieldType === 'value2' ? (
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
													? colors.dataValue
													: colors.textMuted
											}
										>
											{valueToString(condition.value2) || 'value2'}
										</Text>
									)}
								</Box>
							</>
						)}

						{/* Delete button */}
						<Text
							color={activeFieldType === 'delete' ? colors.error : colors.textMuted}
							bold={activeFieldType === 'delete'}
						>
							{activeFieldType === 'delete' ? '[×]' : ' × '}
						</Text>
					</Box>
				)
			})}

			{/* Action buttons */}
			<Box marginTop={1} gap={2}>
				<Text
					color={activeField?.type === 'add' ? colors.focus : colors.textMuted}
					bold={activeField?.type === 'add'}
				>
					{activeField?.type === 'add' ? '[+ Add]' : ' + Add '}
				</Text>
				<Text
					color={activeField?.type === 'clear' ? colors.error : colors.textMuted}
					bold={activeField?.type === 'clear'}
				>
					{activeField?.type === 'clear' ? '[Clear all]' : ' Clear all '}
				</Text>
			</Box>
		</Box>
	)
}
