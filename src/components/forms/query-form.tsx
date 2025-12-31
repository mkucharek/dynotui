import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { useState } from 'react'
import type { FilterCondition, SortKeyOperator } from '../../schemas/query-params.js'
import { colors, symbols } from '../../theme.js'
import { FilterBuilder } from './filter-builder.js'

// Form output type (without tableName, which is added by the caller)
export type QueryFormOutput = {
	partitionKey: { name: string; value: string | number }
	sortKey?: {
		name: string
		value: string | number
		operator: SortKeyOperator
		valueTo?: string | number
	}
	filterConditions?: FilterCondition[]
}

// Initial values for populating form from previous query
export type QueryFormInitialValues = {
	partitionKey?: { name: string; value: string | number }
	sortKey?: {
		name: string
		value: string | number
		operator?: SortKeyOperator
		valueTo?: string | number
	}
	filterConditions?: FilterCondition[]
}

export type QueryFormProps = {
	partitionKeyName: string
	sortKeyName?: string
	onSubmit: (params: QueryFormOutput) => void
	onCancel: () => void
	focused?: boolean
	initialValues?: QueryFormInitialValues
}

type FormField = 'pk' | 'skOp' | 'sk' | 'sk2'
type FormSection = 'keys' | 'filters'

const SK_OPERATORS: { value: SortKeyOperator; label: string; shortcut: string }[] = [
	{ value: 'eq', label: '=', shortcut: '=' },
	{ value: 'lt', label: '<', shortcut: '<' },
	{ value: 'lte', label: '≤', shortcut: '[' },
	{ value: 'gt', label: '>', shortcut: '>' },
	{ value: 'gte', label: '≥', shortcut: ']' },
	{ value: 'begins_with', label: 'begins_with', shortcut: '^' },
	{ value: 'between', label: 'between', shortcut: 'b' },
]

// Map shortcuts to operator indices for quick lookup
const SHORTCUT_TO_OPERATOR_INDEX = new Map<string, number>(
	SK_OPERATORS.map((op, idx) => [op.shortcut, idx]),
)

function parseValue(value: string): string | number {
	const trimmed = value.trim()
	// Check if it's a valid number (integer or float)
	if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
		const num = Number(trimmed)
		if (!Number.isNaN(num)) {
			return num
		}
	}
	return trimmed
}

export function QueryForm({
	partitionKeyName,
	sortKeyName,
	onSubmit,
	onCancel,
	focused = true,
	initialValues,
}: QueryFormProps) {
	// Initialize from previous query values if provided
	const initPk = initialValues?.partitionKey?.value?.toString() ?? ''
	const initSkOp = initialValues?.sortKey?.operator ?? 'eq'
	const initSkOpIndex = SK_OPERATORS.findIndex((op) => op.value === initSkOp)
	const initSk = initialValues?.sortKey?.value?.toString() ?? ''
	const initSk2 = initialValues?.sortKey?.valueTo?.toString() ?? ''
	const initFilters = initialValues?.filterConditions ?? []

	const [pkValue, setPkValue] = useState(initPk)
	const [skOperator, setSkOperator] = useState<SortKeyOperator>(initSkOp)
	const [skValue, setSkValue] = useState(initSk)
	const [skValue2, setSkValue2] = useState(initSk2)
	const [activeField, setActiveField] = useState<FormField>('pk')
	const [opIndex, setOpIndex] = useState(initSkOpIndex >= 0 ? initSkOpIndex : 0)
	const [activeSection, setActiveSection] = useState<FormSection>('keys')
	const [filterConditions, setFilterConditions] = useState<FilterCondition[]>(initFilters)

	const fields: FormField[] = sortKeyName ? ['pk', 'skOp', 'sk'] : ['pk']
	if (sortKeyName && skOperator === 'between') {
		fields.push('sk2')
	}

	const currentFieldIndex = fields.indexOf(activeField)
	const isOnLastField = activeField === fields[fields.length - 1]

	const handleSubmit = () => {
		if (!pkValue) return
		const params: QueryFormOutput = {
			partitionKey: { name: partitionKeyName, value: parseValue(pkValue) },
		}
		if (sortKeyName && skValue) {
			params.sortKey = {
				name: sortKeyName,
				operator: skOperator,
				value: parseValue(skValue),
				valueTo: skOperator === 'between' ? parseValue(skValue2) : undefined,
			}
		}
		if (filterConditions.length > 0) {
			// Only include valid filters (with attribute name)
			const validFilters = filterConditions.filter((f) => f.attribute.trim() !== '')
			if (validFilters.length > 0) {
				params.filterConditions = validFilters
			}
		}
		onSubmit(params)
	}

	useInput(
		(input, key) => {
			if (!focused || activeSection !== 'keys') return

			if (key.escape) {
				onCancel()
				return
			}

			// Press 'f' on last field to add filters
			if (input === 'f' && isOnLastField) {
				setFilterConditions([{ attribute: '', operator: 'eq', value: '' }])
				setActiveSection('filters')
				return
			}

			// Shift+Tab for backwards navigation
			if (key.tab && key.shift) {
				if (currentFieldIndex > 0) {
					const prevField = fields[currentFieldIndex - 1]
					if (prevField) setActiveField(prevField)
				}
				return
			}

			// Tab moves to next field
			if (key.tab) {
				const nextIndex = (currentFieldIndex + 1) % fields.length
				const nextField = fields[nextIndex]
				if (nextField) setActiveField(nextField)
				return
			}

			// Enter submits if PK has value (regardless of which field is focused)
			if (key.return && pkValue) {
				handleSubmit()
				return
			}

			if (activeField === 'skOp') {
				// Check for shortcut keys first
				const shortcutIdx = SHORTCUT_TO_OPERATOR_INDEX.get(input)
				if (shortcutIdx !== undefined) {
					const newOp = SK_OPERATORS[shortcutIdx]
					if (newOp) {
						setOpIndex(shortcutIdx)
						setSkOperator(newOp.value)
					}
					return
				}

				if (input === 'j' || key.downArrow) {
					const newIndex = (opIndex + 1) % SK_OPERATORS.length
					const newOp = SK_OPERATORS[newIndex]
					if (newOp) {
						setOpIndex(newIndex)
						setSkOperator(newOp.value)
					}
				} else if (input === 'k' || key.upArrow) {
					const newIndex = (opIndex - 1 + SK_OPERATORS.length) % SK_OPERATORS.length
					const newOp = SK_OPERATORS[newIndex]
					if (newOp) {
						setOpIndex(newIndex)
						setSkOperator(newOp.value)
					}
				}
			}
		},
		{ isActive: focused && activeSection === 'keys' },
	)

	const isPkActive = activeField === 'pk'
	const isSkSectionActive = activeField === 'skOp' || activeField === 'sk' || activeField === 'sk2'
	const currentOp = SK_OPERATORS[opIndex]

	return (
		<Box flexDirection="column" gap={1}>
			{/* Partition Key Card */}
			<Box flexDirection="column">
				<Box
					borderStyle="round"
					borderColor={isPkActive ? colors.focus : colors.border}
					paddingX={1}
					flexDirection="column"
				>
					<Box marginBottom={0}>
						<Text color={isPkActive ? colors.focus : colors.textMuted} bold>
							Partition Key
						</Text>
					</Box>
					<Box gap={1}>
						<Text color={isPkActive ? colors.focus : colors.textSecondary}>
							{partitionKeyName}:
						</Text>
						<TextInput
							value={pkValue}
							onChange={setPkValue}
							focus={focused && activeField === 'pk'}
							placeholder="Enter value"
						/>
					</Box>
				</Box>
			</Box>

			{/* Sort Key Card */}
			{sortKeyName && (
				<Box flexDirection="column">
					<Box
						borderStyle="round"
						borderColor={isSkSectionActive ? colors.focus : colors.border}
						paddingX={1}
						flexDirection="column"
					>
						<Box marginBottom={0}>
							<Text color={isSkSectionActive ? colors.focus : colors.textMuted} bold>
								Sort Key
							</Text>
							<Text color={colors.textMuted}> (optional)</Text>
						</Box>

						{/* Operator dropdown */}
						<Box gap={1} alignItems="center">
							<Text color={activeField === 'skOp' ? colors.focus : colors.textSecondary}>
								Operator:
							</Text>
							<Box
								borderStyle="single"
								borderColor={activeField === 'skOp' ? colors.focus : colors.border}
								paddingX={1}
								width={18}
							>
								<Text color={activeField === 'skOp' ? colors.focus : colors.text}>
									{currentOp?.label ?? '='}
								</Text>
								{activeField === 'skOp' && (
									<Text color={colors.textMuted}> [{currentOp?.shortcut}]</Text>
								)}
								<Text color={activeField === 'skOp' ? colors.focus : colors.textMuted}>
									{' '}
									{symbols.expanded}
								</Text>
							</Box>
						</Box>

						{/* Value input */}
						<Box gap={1}>
							<Text color={activeField === 'sk' ? colors.focus : colors.textSecondary}>
								{sortKeyName}:
							</Text>
							<TextInput
								value={skValue}
								onChange={setSkValue}
								focus={focused && activeField === 'sk'}
								placeholder="Enter value"
							/>
						</Box>

						{/* Second value for between */}
						{skOperator === 'between' && (
							<Box gap={1}>
								<Text color={activeField === 'sk2' ? colors.focus : colors.textSecondary}>
									and:
								</Text>
								<TextInput
									value={skValue2}
									onChange={setSkValue2}
									focus={focused && activeField === 'sk2'}
									placeholder="Enter second value"
								/>
							</Box>
						)}
					</Box>
				</Box>
			)}

			{/* Filter Builder */}
			{activeSection === 'filters' && (
				<Box marginTop={1}>
					<FilterBuilder
						conditions={filterConditions}
						onChange={setFilterConditions}
						focused={focused && activeSection === 'filters'}
						onExit={() => {
							if (pkValue) {
								handleSubmit()
							} else {
								setActiveSection('keys')
							}
						}}
						onCancel={() => setActiveSection('keys')}
					/>
				</Box>
			)}
		</Box>
	)
}
