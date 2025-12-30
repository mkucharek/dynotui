import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { useState } from 'react'
import type { FilterCondition, SortKeyOperator } from '../../schemas/query-params.js'
import { colors } from '../../theme.js'
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

export type QueryFormProps = {
	partitionKeyName: string
	sortKeyName?: string
	onSubmit: (params: QueryFormOutput) => void
	onCancel: () => void
	focused?: boolean
}

type FormField = 'pk' | 'skOp' | 'sk' | 'sk2'
type FormSection = 'keys' | 'filters'

const SK_OPERATORS: { value: SortKeyOperator; label: string }[] = [
	{ value: 'eq', label: '=' },
	{ value: 'lt', label: '<' },
	{ value: 'lte', label: '<=' },
	{ value: 'gt', label: '>' },
	{ value: 'gte', label: '>=' },
	{ value: 'begins_with', label: 'begins_with' },
	{ value: 'between', label: 'between' },
]

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
}: QueryFormProps) {
	const [pkValue, setPkValue] = useState('')
	const [skOperator, setSkOperator] = useState<SortKeyOperator>('eq')
	const [skValue, setSkValue] = useState('')
	const [skValue2, setSkValue2] = useState('')
	const [activeField, setActiveField] = useState<FormField>('pk')
	const [opIndex, setOpIndex] = useState(0)
	const [activeSection, setActiveSection] = useState<FormSection>('keys')
	const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([])

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

			if (key.tab || (key.return && !isOnLastField)) {
				const nextIndex = (currentFieldIndex + 1) % fields.length
				const nextField = fields[nextIndex]
				if (nextField) setActiveField(nextField)
				return
			}

			if (key.return && isOnLastField && pkValue) {
				handleSubmit()
				return
			}

			if (activeField === 'skOp') {
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

	return (
		<Box flexDirection="column" gap={1}>
			{/* Partition Key */}
			<Box>
				<Box width={20}>
					<Text color={activeField === 'pk' ? colors.focus : colors.textSecondary}>
						{partitionKeyName} (PK):
					</Text>
				</Box>
				<TextInput
					value={pkValue}
					onChange={setPkValue}
					focus={focused && activeField === 'pk'}
					placeholder="Enter partition key value"
				/>
			</Box>

			{/* Sort Key */}
			{sortKeyName && (
				<>
					<Box>
						<Box width={20}>
							<Text color={activeField === 'skOp' ? colors.focus : colors.textSecondary}>
								{sortKeyName} operator:
							</Text>
						</Box>
						<Text>
							{SK_OPERATORS.map((op, i) => (
								<Text key={op.value} color={i === opIndex ? colors.focus : colors.textMuted}>
									{i === opIndex ? `[${op.label}]` : ` ${op.label} `}
									{i < SK_OPERATORS.length - 1 ? ' ' : ''}
								</Text>
							))}
						</Text>
					</Box>

					<Box>
						<Box width={20}>
							<Text color={activeField === 'sk' ? colors.focus : colors.textSecondary}>
								{sortKeyName} value:
							</Text>
						</Box>
						<TextInput
							value={skValue}
							onChange={setSkValue}
							focus={focused && activeField === 'sk'}
							placeholder="Enter sort key value"
						/>
					</Box>

					{skOperator === 'between' && (
						<Box>
							<Box width={20}>
								<Text color={activeField === 'sk2' ? colors.focus : colors.textSecondary}>
									{sortKeyName} value2:
								</Text>
							</Box>
							<TextInput
								value={skValue2}
								onChange={setSkValue2}
								focus={focused && activeField === 'sk2'}
								placeholder="Enter second value"
							/>
						</Box>
					)}
				</>
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
					/>
				</Box>
			)}
		</Box>
	)
}
