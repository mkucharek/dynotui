import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { useState } from 'react'
import type { QueryParams, SortKeyOperator } from '../../schemas/query-params.js'

export type QueryFormProps = {
	partitionKeyName: string
	sortKeyName?: string
	onSubmit: (params: QueryParams) => void
	onCancel: () => void
	focused?: boolean
}

type FormField = 'pk' | 'skOp' | 'sk' | 'sk2'

const SK_OPERATORS: { value: SortKeyOperator; label: string }[] = [
	{ value: 'eq', label: '=' },
	{ value: 'lt', label: '<' },
	{ value: 'lte', label: '<=' },
	{ value: 'gt', label: '>' },
	{ value: 'gte', label: '>=' },
	{ value: 'begins_with', label: 'begins_with' },
	{ value: 'between', label: 'between' },
]

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

	const fields: FormField[] = sortKeyName ? ['pk', 'skOp', 'sk'] : ['pk']
	if (sortKeyName && skOperator === 'between') {
		fields.push('sk2')
	}

	const currentFieldIndex = fields.indexOf(activeField)

	useInput(
		(input, key) => {
			if (!focused) return

			if (key.escape) {
				onCancel()
				return
			}

			if (key.tab || (key.return && activeField !== fields[fields.length - 1])) {
				const nextIndex = (currentFieldIndex + 1) % fields.length
				setActiveField(fields[nextIndex])
				return
			}

			if (key.return && activeField === fields[fields.length - 1] && pkValue) {
				const params: QueryParams = {
					partitionKey: { name: partitionKeyName, value: pkValue },
				}
				if (sortKeyName && skValue) {
					params.sortKey = {
						name: sortKeyName,
						operator: skOperator,
						value: skValue,
						value2: skOperator === 'between' ? skValue2 : undefined,
					}
				}
				onSubmit(params)
				return
			}

			if (activeField === 'skOp') {
				if (input === 'j' || key.downArrow) {
					const newIndex = (opIndex + 1) % SK_OPERATORS.length
					setOpIndex(newIndex)
					setSkOperator(SK_OPERATORS[newIndex].value)
				} else if (input === 'k' || key.upArrow) {
					const newIndex = (opIndex - 1 + SK_OPERATORS.length) % SK_OPERATORS.length
					setOpIndex(newIndex)
					setSkOperator(SK_OPERATORS[newIndex].value)
				}
			}
		},
		{ isActive: focused },
	)

	return (
		<Box flexDirection="column" gap={1}>
			<Box>
				<Text bold color="cyan">
					Query Builder
				</Text>
			</Box>

			{/* Partition Key */}
			<Box>
				<Box width={20}>
					<Text color={activeField === 'pk' ? 'cyan' : undefined}>{partitionKeyName} (PK):</Text>
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
							<Text color={activeField === 'skOp' ? 'cyan' : undefined}>
								{sortKeyName} operator:
							</Text>
						</Box>
						<Text>
							{SK_OPERATORS.map((op, i) => (
								<Text key={op.value} color={i === opIndex ? 'cyan' : 'gray'}>
									{i === opIndex ? `[${op.label}]` : ` ${op.label} `}
									{i < SK_OPERATORS.length - 1 ? ' ' : ''}
								</Text>
							))}
						</Text>
					</Box>

					<Box>
						<Box width={20}>
							<Text color={activeField === 'sk' ? 'cyan' : undefined}>{sortKeyName} value:</Text>
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
								<Text color={activeField === 'sk2' ? 'cyan' : undefined}>
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

			<Box marginTop={1}>
				<Text dimColor>
					<Text color="cyan">Tab</Text> Next field {'  '}
					<Text color="cyan">Enter</Text> Submit {'  '}
					<Text color="cyan">Esc</Text> Cancel
				</Text>
			</Box>
		</Box>
	)
}
