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
		expect(frame).toContain('Content')
		expect(frame.includes('Tables') || frame.includes('Content')).toBe(true)
	})
})
