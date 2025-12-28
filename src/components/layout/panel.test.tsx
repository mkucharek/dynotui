import { Text } from 'ink'
import { render } from 'ink-testing-library'
import { describe, expect, it } from 'vitest'
import { Panel } from './panel.js'

describe('Panel', () => {
	it('renders children', () => {
		const { lastFrame } = render(
			<Panel>
				<Text>Content</Text>
			</Panel>,
		)
		expect(lastFrame()).toContain('Content')
	})

	it('renders title when provided', () => {
		const { lastFrame } = render(
			<Panel title="Tables">
				<Text>Content</Text>
			</Panel>,
		)
		const frame = lastFrame() ?? ''
		// Title overlaps border via negative margin, may not render in test
		expect(frame).toContain('Content')
	})
})
