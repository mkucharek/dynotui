import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { useEffect, useRef, useState } from 'react'
import type { FilterCondition, FilterOperator } from '../../schemas/query-params.js'
import { colors, symbols } from '../../theme.js'

export type FilterBuilderProps = {
	conditions: FilterCondition[]
	onChange: (conditions: FilterCondition[]) => void
	focused?: boolean
	onExit?: () => void
	onClear?: () => void // Called when all filters are cleared
	availableAttributes?: string[] // For autocomplete
}

type FieldType = 'attribute' | 'operator' | 'value' | 'value2' | 'delete'

type ActiveField =
	| { type: 'field'; conditionIndex: number; field: FieldType }
	| { type: 'add' }
	| { type: 'clear' }

const FILTER_OPERATORS: {
	value: FilterOperator
	label: string
	shortcut: string // Keyboard shortcut to select this operator
	needsValue: boolean
	needsValue2: boolean
}[] = [
	{ value: 'eq', label: '=', shortcut: '=', needsValue: true, needsValue2: false },
	{ value: 'ne', label: '≠', shortcut: '!', needsValue: true, needsValue2: false },
	{ value: 'lt', label: '<', shortcut: '<', needsValue: true, needsValue2: false },
	{ value: 'lte', label: '≤', shortcut: '[', needsValue: true, needsValue2: false },
	{ value: 'gt', label: '>', shortcut: '>', needsValue: true, needsValue2: false },
	{ value: 'gte', label: '≥', shortcut: ']', needsValue: true, needsValue2: false },
	{ value: 'between', label: 'between', shortcut: 'b', needsValue: true, needsValue2: true },
	{
		value: 'begins_with',
		label: 'begins_with',
		shortcut: '^',
		needsValue: true,
		needsValue2: false,
	},
	{ value: 'contains', label: 'contains', shortcut: '~', needsValue: true, needsValue2: false },
	{
		value: 'attribute_exists',
		label: 'exists',
		shortcut: 'e',
		needsValue: false,
		needsValue2: false,
	},
	{
		value: 'attribute_not_exists',
		label: 'not exists',
		shortcut: 'x',
		needsValue: false,
		needsValue2: false,
	},
]

// Map shortcuts to operator indices for quick lookup
const SHORTCUT_TO_OPERATOR_INDEX = new Map<string, number>(
	FILTER_OPERATORS.map((op, idx) => [op.shortcut, idx]),
)

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

// Get ghost text completion (the part to add after current input)
function getGhostCompletion(currentValue: string, suggestion: string | undefined): string {
	if (!suggestion) return ''
	// When empty, show full suggestion as ghost text
	if (!currentValue) return suggestion
	const lowerValue = currentValue.toLowerCase()
	const lowerSuggestion = suggestion.toLowerCase()
	// If suggestion starts with current value, show the rest as ghost
	if (lowerSuggestion.startsWith(lowerValue)) {
		return suggestion.slice(currentValue.length)
	}
	// If current value is contained in suggestion, show full suggestion
	if (lowerSuggestion.includes(lowerValue)) {
		return ` → ${suggestion}`
	}
	return ''
}

// Format value for display with quotes for strings
function formatDisplayValue(value: string | number | boolean | undefined): string {
	if (value === undefined || value === '') return ''
	if (typeof value === 'number') return String(value)
	return `"${value}"`
}

export function FilterBuilder({
	conditions,
	onChange,
	focused = true,
	onExit,
	onClear,
	availableAttributes = [],
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

	// Autocomplete state
	const [suggestionIndex, setSuggestionIndex] = useState(0)

	// Filter suggestions based on current attribute value
	const currentAttributeValue =
		activeField?.type === 'field' && activeField.field === 'attribute'
			? (conditions[activeField.conditionIndex]?.attribute ?? '')
			: ''

	const filteredSuggestions = availableAttributes.filter(
		(attr) =>
			attr.toLowerCase().includes(currentAttributeValue.toLowerCase()) &&
			attr !== currentAttributeValue,
	)

	// Show suggestions when on attribute field with available attributes
	// (simplified - no need for separate showSuggestions state)
	const shouldShowSuggestions =
		activeField?.type === 'field' &&
		activeField.field === 'attribute' &&
		availableAttributes.length > 0 &&
		filteredSuggestions.length > 0

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

	// Reset suggestion index when suggestions change or field changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on changes
	useEffect(() => {
		setSuggestionIndex(0)
	}, [filteredSuggestions.length, activeField])

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
				if (key.tab && key.shift) {
					// Shift+Tab from Clear goes to Add button
					setActiveField({ type: 'add' })
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
				if (key.tab && key.shift) {
					// Shift+Tab from Add goes to last condition's delete (or nothing)
					if (conditions.length > 0) {
						const lastFields = getFieldsForCondition(conditions.length - 1)
						const lastField = lastFields[lastFields.length - 1]
						if (lastField) {
							setActiveField({
								type: 'field',
								conditionIndex: conditions.length - 1,
								field: lastField,
							})
						}
					}
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

				// Autocomplete handling for attribute field - arrow keys cycle suggestions
				if (field === 'attribute' && shouldShowSuggestions) {
					if (key.downArrow) {
						setSuggestionIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0))
						return
					}
					if (key.upArrow) {
						setSuggestionIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1))
						return
					}
					// Tab (not shift+tab) accepts current suggestion and moves to next field
					if (key.tab && !key.shift && filteredSuggestions[suggestionIndex]) {
						updateCondition(conditionIndex, { attribute: filteredSuggestions[suggestionIndex] })
						setActiveField({ type: 'field', conditionIndex, field: 'operator' })
						return
					}
				}

				// Navigate operator with arrows or type shortcut to jump directly
				if (field === 'operator') {
					const opIdx = operatorIndices[conditionIndex] ?? 0

					// Check for shortcut keys first
					const shortcutIdx = SHORTCUT_TO_OPERATOR_INDEX.get(input)
					if (shortcutIdx !== undefined) {
						const newOp = FILTER_OPERATORS[shortcutIdx]
						if (newOp) {
							const newOpIndices = [...operatorIndices]
							newOpIndices[conditionIndex] = shortcutIdx
							setOperatorIndices(newOpIndices)
							updateCondition(conditionIndex, { operator: newOp.value })
						}
						return
					}

					if (key.downArrow) {
						const newOpIdx = (opIdx + 1) % FILTER_OPERATORS.length
						const newOp = FILTER_OPERATORS[newOpIdx]
						if (!newOp) return
						const newOpIndices = [...operatorIndices]
						newOpIndices[conditionIndex] = newOpIdx
						setOperatorIndices(newOpIndices)
						updateCondition(conditionIndex, { operator: newOp.value })
						return
					}
					if (key.upArrow) {
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

				// Shift+Tab to previous field
				if (key.tab && key.shift) {
					const fields = getFieldsForCondition(conditionIndex)
					const currentFieldIndex = fields.indexOf(field)
					const prevFieldIndex = currentFieldIndex - 1
					const prevField = fields[prevFieldIndex]

					if (prevField) {
						setActiveField({ type: 'field', conditionIndex, field: prevField })
					} else if (conditionIndex > 0) {
						// Move to previous condition's last field
						const prevFields = getFieldsForCondition(conditionIndex - 1)
						const lastField = prevFields[prevFields.length - 1]
						if (lastField) {
							setActiveField({
								type: 'field',
								conditionIndex: conditionIndex - 1,
								field: lastField,
							})
						}
					} else {
						// At first field of first condition, go to Clear button
						setActiveField({ type: 'clear' })
					}
					return
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

	// Empty state
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
			{/* Header */}
			<Box marginBottom={1}>
				<Text bold color={colors.brand}>
					Filters
				</Text>
				<Text color={colors.textMuted}> ({conditions.length})</Text>
			</Box>

			{/* Filter rows as cards */}
			{conditions.map((condition, idx) => {
				const opIdx = operatorIndices[idx] ?? 0
				const op = FILTER_OPERATORS[opIdx] ?? FILTER_OPERATORS[0]
				const isActiveCondition =
					activeField?.type === 'field' && activeField.conditionIndex === idx
				const activeFieldType = isActiveCondition ? activeField.field : null
				const conditionId = conditionIds[idx] ?? idx

				return (
					<Box key={conditionId} flexDirection="column">
						{/* Filter card with border */}
						<Box
							borderStyle="round"
							borderColor={isActiveCondition ? colors.focus : colors.border}
							paddingX={1}
							flexDirection="column"
						>
							{/* Card header with row number */}
							<Box marginBottom={0}>
								<Text color={isActiveCondition ? colors.focus : colors.textMuted} bold>
									#{idx + 1}
								</Text>
							</Box>

							{/* Filter fields row */}
							<Box gap={2} alignItems="center">
								{/* Attribute with ghost text autocomplete */}
								<Box width={22}>
									{activeFieldType === 'attribute' ? (
										(() => {
											const suggestion = filteredSuggestions[suggestionIndex]
											const ghostText = suggestion
												? getGhostCompletion(condition.attribute, suggestion)
												: ''
											const showGhost = isActiveCondition && ghostText.length > 0
											return (
												<Box>
													<TextInput
														value={condition.attribute}
														onChange={(val) => updateCondition(idx, { attribute: val })}
														focus={focused}
														placeholder={showGhost ? '' : 'attribute'}
													/>
													{showGhost && <Text color={colors.textMuted}>{ghostText}</Text>}
												</Box>
											)
										})()
									) : (
										<Text color={condition.attribute ? colors.dataKey : colors.textMuted}>
											{condition.attribute || 'attribute'}
										</Text>
									)}
								</Box>

								{/* Operator dropdown - fixed width to prevent jumping */}
								<Box
									borderStyle="single"
									borderColor={activeFieldType === 'operator' ? colors.focus : colors.border}
									paddingX={1}
									width={18}
								>
									<Text color={activeFieldType === 'operator' ? colors.focus : colors.text}>
										{op?.label ?? '='}
									</Text>
									{activeFieldType === 'operator' && (
										<Text color={colors.textMuted}> [{op?.shortcut}]</Text>
									)}
									<Text color={activeFieldType === 'operator' ? colors.focus : colors.textMuted}>
										{' '}
										{symbols.expanded}
									</Text>
								</Box>

								{/* Value */}
								{op?.needsValue && (
									<Box width={18}>
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
												{formatDisplayValue(condition.value) || 'value'}
											</Text>
										)}
									</Box>
								)}

								{/* Value2 (for between) */}
								{op?.needsValue2 && (
									<>
										<Text color={colors.textMuted}>and</Text>
										<Box width={18}>
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
													{formatDisplayValue(condition.value2) || 'value2'}
												</Text>
											)}
										</Box>
									</>
								)}

								{/* Delete button */}
								<Box
									borderStyle="single"
									borderColor={activeFieldType === 'delete' ? colors.error : colors.border}
									paddingX={1}
								>
									<Text
										color={activeFieldType === 'delete' ? colors.error : colors.textMuted}
										bold={activeFieldType === 'delete'}
									>
										×
									</Text>
								</Box>
							</Box>
						</Box>
					</Box>
				)
			})}

			{/* Action buttons */}
			<Box marginTop={1} gap={2}>
				<Box
					borderStyle="single"
					borderColor={activeField?.type === 'add' ? colors.focus : colors.border}
					paddingX={1}
				>
					<Text
						color={activeField?.type === 'add' ? colors.focus : colors.textMuted}
						bold={activeField?.type === 'add'}
					>
						+ Add
					</Text>
				</Box>
				<Box
					borderStyle="single"
					borderColor={activeField?.type === 'clear' ? colors.error : colors.border}
					paddingX={1}
				>
					<Text
						color={activeField?.type === 'clear' ? colors.error : colors.textMuted}
						bold={activeField?.type === 'clear'}
					>
						Clear all
					</Text>
				</Box>
			</Box>
		</Box>
	)
}
