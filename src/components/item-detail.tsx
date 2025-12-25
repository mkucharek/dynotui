import { Box, Text, useInput } from 'ink'
import { useMemo, useState } from 'react'

export type ItemDetailProps = {
	item: Record<string, unknown>
	maxHeight?: number
	focused?: boolean
}

type JsonLine = {
	id: string
	indent: number
	key?: string
	value?: string
	valueColor?: string
	isOpener?: boolean
	isCloser?: boolean
	bracket?: string
}

let lineIdCounter = 0
function nextId(prefix: string): string {
	return `${prefix}-${++lineIdCounter}`
}

function jsonToLines(obj: unknown, indent = 0, path = 'root'): JsonLine[] {
	const lines: JsonLine[] = []

	if (obj === null) {
		lines.push({ id: nextId(path), indent, value: 'null', valueColor: 'gray' })
	} else if (typeof obj === 'boolean') {
		lines.push({ id: nextId(path), indent, value: String(obj), valueColor: 'yellow' })
	} else if (typeof obj === 'number') {
		lines.push({ id: nextId(path), indent, value: String(obj), valueColor: 'cyan' })
	} else if (typeof obj === 'string') {
		lines.push({ id: nextId(path), indent, value: `"${obj}"`, valueColor: 'green' })
	} else if (Array.isArray(obj)) {
		if (obj.length === 0) {
			lines.push({ id: nextId(path), indent, value: '[]', valueColor: 'gray' })
		} else {
			lines.push({ id: nextId(`${path}-open`), indent, isOpener: true, bracket: '[' })
			obj.forEach((item, i) => {
				const itemLines = jsonToLines(item, indent + 2, `${path}[${i}]`)
				if (i < obj.length - 1 && itemLines.length > 0) {
					const last = itemLines[itemLines.length - 1]
					if (last.value) last.value += ','
					else if (last.bracket) last.bracket += ','
				}
				lines.push(...itemLines)
			})
			lines.push({ id: nextId(`${path}-close`), indent, isCloser: true, bracket: ']' })
		}
	} else if (typeof obj === 'object') {
		const entries = Object.entries(obj as Record<string, unknown>)
		if (entries.length === 0) {
			lines.push({ id: nextId(path), indent, value: '{}', valueColor: 'gray' })
		} else {
			lines.push({ id: nextId(`${path}-open`), indent, isOpener: true, bracket: '{' })
			entries.forEach(([key, val], i) => {
				const valLines = jsonToLines(val, indent + 2, `${path}.${key}`)
				if (valLines.length === 1 && valLines[0].value) {
					const comma = i < entries.length - 1 ? ',' : ''
					lines.push({
						id: nextId(`${path}.${key}`),
						indent: indent + 2,
						key,
						value: valLines[0].value + comma,
						valueColor: valLines[0].valueColor,
					})
				} else {
					lines.push({
						id: nextId(`${path}.${key}-open`),
						indent: indent + 2,
						key,
						isOpener: true,
						bracket: valLines[0].bracket,
					})
					lines.push(...valLines.slice(1, -1))
					const lastLine = valLines[valLines.length - 1]
					const comma = i < entries.length - 1 ? ',' : ''
					lines.push({
						...lastLine,
						id: nextId(`${path}.${key}-close`),
						bracket: (lastLine.bracket ?? '') + comma,
					})
				}
			})
			lines.push({ id: nextId(`${path}-close`), indent, isCloser: true, bracket: '}' })
		}
	}

	return lines
}

export function ItemDetail({ item, maxHeight = 30, focused = true }: ItemDetailProps) {
	const [scrollOffset, setScrollOffset] = useState(0)

	const lines = useMemo(() => {
		lineIdCounter = 0
		return jsonToLines(item)
	}, [item])

	useInput(
		(input, key) => {
			if (!focused) return

			if (input === 'j' || key.downArrow) {
				setScrollOffset((prev) => Math.min(prev + 1, Math.max(0, lines.length - maxHeight)))
			} else if (input === 'k' || key.upArrow) {
				setScrollOffset((prev) => Math.max(prev - 1, 0))
			} else if (input === 'g') {
				setScrollOffset(0)
			} else if (input === 'G') {
				setScrollOffset(Math.max(0, lines.length - maxHeight))
			}
		},
		{ isActive: focused },
	)

	const visibleLines = lines.slice(scrollOffset, scrollOffset + maxHeight)

	return (
		<Box flexDirection="column">
			{visibleLines.map((line) => (
				<Box key={line.id}>
					<Text>
						{'  '.repeat(line.indent / 2)}
						{line.key && (
							<>
								<Text color="magenta">"{line.key}"</Text>
								<Text>: </Text>
							</>
						)}
						{line.bracket && <Text>{line.bracket}</Text>}
						{line.value && <Text color={line.valueColor as never}>{line.value}</Text>}
					</Text>
				</Box>
			))}

			{lines.length > maxHeight && (
				<Box marginTop={1}>
					<Text dimColor>
						Lines {scrollOffset + 1}-{Math.min(scrollOffset + maxHeight, lines.length)} of{' '}
						{lines.length} {'  '}
						<Text color="cyan">j/k</Text> scroll {'  '}
						<Text color="cyan">g/G</Text> top/bottom
					</Text>
				</Box>
			)}
		</Box>
	)
}
