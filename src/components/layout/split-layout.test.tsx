import { Text } from 'ink'
import { render } from 'ink-testing-library'
import { describe, expect, it } from 'vitest'
import { SplitLayout } from './split-layout.js'

describe('SplitLayout', () => {
	it('renders sidebar and main content', () => {
		const { lastFrame } = render(
			<SplitLayout sidebar={<Text>Sidebar</Text>} main={<Text>Main</Text>} />,
		)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('Sidebar')
		expect(frame).toContain('Main')
	})

	it('applies custom sidebar width', () => {
		const { lastFrame } = render(
			<SplitLayout sidebar={<Text>Sidebar</Text>} main={<Text>Main</Text>} sidebarWidth={40} />,
		)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('Sidebar')
		expect(frame).toContain('Main')
	})

	it('renders with height prop', () => {
		const { lastFrame } = render(
			<SplitLayout sidebar={<Text>Sidebar</Text>} main={<Text>Main</Text>} height={20} />,
		)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('Sidebar')
		expect(frame).toContain('Main')
	})
})
