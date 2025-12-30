import { Box, Text, useInput } from 'ink'
import { useMemo, useState } from 'react'
import { colors, symbols } from '../theme.js'

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

type IdGenerator = (prefix: string) => string

function createIdGenerator(): IdGenerator {
	let counter = 0
	return (prefix: string) => `${prefix}-${++counter}`
}

function jsonToLines(obj: unknown, nextId: IdGenerator, indent = 0, path = 'root'): JsonLine[] {
	const lines: JsonLine[] = []

	if (obj === null) {
		lines.push({ id: nextId(path), indent, value: symbols.null, valueColor: colors.dataNull })
	} else if (typeof obj === 'boolean') {
		lines.push({ id: nextId(path), indent, value: String(obj), valueColor: colors.focus })
	} else if (typeof obj === 'number') {
		lines.push({ id: nextId(path), indent, value: String(obj), valueColor: colors.dataValue })
	} else if (typeof obj === 'string') {
		lines.push({ id: nextId(path), indent, value: `"${obj}"`, valueColor: colors.active })
	} else if (
		obj instanceof Uint8Array ||
		(obj && typeof obj === 'object' && 'type' in obj && obj.type === 'Buffer')
	) {
		// Binary data
		const len =
			obj instanceof Uint8Array ? obj.length : ((obj as { data?: unknown[] }).data?.length ?? 0)
		lines.push({
			id: nextId(path),
			indent,
			value: `<binary ${len}b>`,
			valueColor: colors.textMuted,
		})
	} else if (Array.isArray(obj)) {
		if (obj.length === 0) {
			lines.push({ id: nextId(path), indent, value: '[]', valueColor: colors.textMuted })
		} else {
			lines.push({ id: nextId(`${path}-open`), indent, isOpener: true, bracket: '[' })
			obj.forEach((item, i) => {
				const itemLines = jsonToLines(item, nextId, indent + 2, `${path}[${i}]`)
				const last = itemLines[itemLines.length - 1]
				if (i < obj.length - 1 && last) {
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
			lines.push({ id: nextId(path), indent, value: '{}', valueColor: colors.textMuted })
		} else {
			lines.push({ id: nextId(`${path}-open`), indent, isOpener: true, bracket: '{' })
			entries.forEach(([key, val], i) => {
				const valLines = jsonToLines(val, nextId, indent + 2, `${path}.${key}`)
				const firstLine = valLines[0]
				const lastLine = valLines[valLines.length - 1]
				if (valLines.length === 1 && firstLine?.value) {
					const comma = i < entries.length - 1 ? ',' : ''
					lines.push({
						id: nextId(`${path}.${key}`),
						indent: indent + 2,
						key,
						value: firstLine.value + comma,
						valueColor: firstLine.valueColor,
					})
				} else if (firstLine && lastLine) {
					lines.push({
						id: nextId(`${path}.${key}-open`),
						indent: indent + 2,
						key,
						isOpener: true,
						bracket: firstLine.bracket,
					})
					lines.push(...valLines.slice(1, -1))
					const comma = i < entries.length - 1 ? ',' : ''
					lines.push({
						id: nextId(`${path}.${key}-close`),
						indent: lastLine.indent,
						isCloser: lastLine.isCloser,
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
		const nextId = createIdGenerator()
		return jsonToLines(item, nextId)
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
	const hasScroll = lines.length > maxHeight

	return (
		<Box flexDirection="column" overflow="hidden">
			{/* Scroll up indicator */}
			{scrollOffset > 0 && (
				<Box justifyContent="flex-end">
					<Text color={colors.textMuted}>{symbols.scrollUp}</Text>
				</Box>
			)}

			{visibleLines.map((line) => (
				<Box key={line.id}>
					<Text wrap="truncate">
						{'  '.repeat(line.indent / 2)}
						{line.key && (
							<>
								<Text color={colors.dataKey}>"{line.key}"</Text>
								<Text color={colors.textSecondary}>: </Text>
							</>
						)}
						{line.bracket && <Text color={colors.textSecondary}>{line.bracket}</Text>}
						{line.value && <Text color={line.valueColor}>{line.value}</Text>}
					</Text>
				</Box>
			))}

			{/* Scroll down indicator */}
			{hasScroll && scrollOffset + maxHeight < lines.length && (
				<Box justifyContent="flex-end">
					<Text color={colors.textMuted}>{symbols.scrollDown}</Text>
				</Box>
			)}
		</Box>
	)
}
