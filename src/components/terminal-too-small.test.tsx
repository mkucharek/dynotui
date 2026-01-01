import { render } from 'ink-testing-library'
import { describe, expect, it } from 'vitest'
import { TERMINAL } from '../constants/terminal.js'
import { TerminalTooSmall } from './terminal-too-small.js'

describe('TerminalTooSmall', () => {
	it('renders error message', () => {
		const { lastFrame } = render(<TerminalTooSmall width={60} height={15} />)
		const output = lastFrame() ?? ''

		expect(output).toContain('Terminal too small')
	})

	it('displays current dimensions', () => {
		const { lastFrame } = render(<TerminalTooSmall width={60} height={15} />)
		const output = lastFrame() ?? ''

		expect(output).toContain('Current: 60x15')
	})

	it('displays required dimensions', () => {
		const { lastFrame } = render(<TerminalTooSmall width={60} height={15} />)
		const output = lastFrame() ?? ''

		expect(output).toContain(`Required: ${TERMINAL.MIN_WIDTH}x${TERMINAL.MIN_HEIGHT}`)
	})

	it('renders with different dimensions', () => {
		const { lastFrame } = render(<TerminalTooSmall width={40} height={10} />)
		const output = lastFrame() ?? ''

		expect(output).toContain('Current: 40x10')
	})
})
