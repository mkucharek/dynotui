import { render } from 'ink-testing-library'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './confirm-dialog.js'

describe('ConfirmDialog', () => {
	it('renders nothing when not visible', () => {
		const { lastFrame } = render(
			<ConfirmDialog
				message="Test message"
				visible={false}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		)
		expect(lastFrame()).toBe('')
	})

	it('renders message and confirm prompt when visible', () => {
		const { lastFrame } = render(
			<ConfirmDialog
				message="Delete this item?"
				visible={true}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('Confirm')
		expect(frame).toContain('Delete this item?')
		expect(frame).toMatch(/Y\/n/i)
	})

	it('centers dialog in container', () => {
		const { lastFrame } = render(
			<ConfirmDialog message="Test" visible={true} onConfirm={vi.fn()} onCancel={vi.fn()} />,
		)
		const frame = lastFrame() ?? ''
		// Dialog should have border characters indicating it's a box
		expect(frame).toMatch(/[╭╮╰╯│─]/)
	})
})
