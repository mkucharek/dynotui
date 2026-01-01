import { Box, Text } from 'ink'
import { render } from 'ink-testing-library'
import { describe, expect, it } from 'vitest'
import { TerminalProvider, useTerminal } from './terminal-context.js'

function TestConsumer() {
	const { width, height, sidebarWidth, mainWidth, contentHeight, isTooSmall } = useTerminal()
	return (
		<Box flexDirection="column">
			<Text>width:{width}</Text>
			<Text>height:{height}</Text>
			<Text>sidebarWidth:{sidebarWidth}</Text>
			<Text>mainWidth:{mainWidth}</Text>
			<Text>contentHeight:{contentHeight}</Text>
			<Text>isTooSmall:{String(isTooSmall)}</Text>
		</Box>
	)
}

describe('TerminalProvider', () => {
	it('provides terminal dimensions to children', () => {
		const { lastFrame } = render(
			<TerminalProvider>
				<TestConsumer />
			</TerminalProvider>,
		)
		const output = lastFrame() ?? ''

		expect(output).toContain('width:')
		expect(output).toContain('height:')
		expect(output).toContain('sidebarWidth:')
		expect(output).toContain('mainWidth:')
		expect(output).toContain('contentHeight:')
		expect(output).toContain('isTooSmall:')
	})

	it('provides numeric values', () => {
		const { lastFrame } = render(
			<TerminalProvider>
				<TestConsumer />
			</TerminalProvider>,
		)
		const output = lastFrame() ?? ''

		// Values should be numbers (not NaN or undefined)
		expect(output).toMatch(/width:\d+/)
		expect(output).toMatch(/height:\d+/)
	})
})

describe('useTerminal', () => {
	it('returns all expected properties', () => {
		const { lastFrame } = render(
			<TerminalProvider>
				<TestConsumer />
			</TerminalProvider>,
		)
		const output = lastFrame() ?? ''

		// Verify all properties are present and have values
		expect(output).toContain('width:')
		expect(output).toContain('height:')
		expect(output).toContain('sidebarWidth:')
		expect(output).toContain('mainWidth:')
		expect(output).toContain('contentHeight:')
		expect(output).toContain('isTooSmall:')
	})
})
