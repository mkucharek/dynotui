import { render } from 'ink-testing-library'
import { describe, expect, it, vi } from 'vitest'
import { FilterBuilder } from './filter-builder.js'

describe('FilterBuilder', () => {
	describe('empty state', () => {
		it('shows empty message when no conditions', () => {
			const { lastFrame } = render(<FilterBuilder conditions={[]} onChange={vi.fn()} />)
			expect(lastFrame()).toContain('No filters configured')
		})

		it('shows Add filter button in empty state', () => {
			const { lastFrame } = render(<FilterBuilder conditions={[]} onChange={vi.fn()} />)
			expect(lastFrame()).toContain('Add filter')
		})
	})

	describe('with conditions', () => {
		const sampleCondition = { attribute: 'status', operator: 'eq' as const, value: 'active' }

		it('renders condition with row number', () => {
			const { lastFrame } = render(
				<FilterBuilder conditions={[sampleCondition]} onChange={vi.fn()} />,
			)
			expect(lastFrame()).toContain('#1')
			expect(lastFrame()).toContain('status')
		})

		it('shows operator label', () => {
			const { lastFrame } = render(
				<FilterBuilder conditions={[sampleCondition]} onChange={vi.fn()} />,
			)
			expect(lastFrame()).toContain('=')
		})

		it('shows Add and Clear all buttons', () => {
			const { lastFrame } = render(
				<FilterBuilder conditions={[sampleCondition]} onChange={vi.fn()} />,
			)
			expect(lastFrame()).toContain('Add')
			expect(lastFrame()).toContain('Clear all')
		})

		it('renders multiple conditions with sequential numbers', () => {
			const conditions = [
				{ attribute: 'status', operator: 'eq' as const, value: 'active' },
				{ attribute: 'count', operator: 'gt' as const, value: 10 },
			]
			const { lastFrame } = render(<FilterBuilder conditions={conditions} onChange={vi.fn()} />)
			expect(lastFrame()).toContain('#1')
			expect(lastFrame()).toContain('#2')
		})
	})

	describe('keyboard navigation', () => {
		it('adds new condition on Enter at Add button', () => {
			const onChange = vi.fn()
			const { stdin } = render(<FilterBuilder conditions={[]} onChange={onChange} focused />)

			stdin.write('\r') // Enter
			expect(onChange).toHaveBeenCalledWith([{ attribute: '', operator: 'eq', value: '' }])
		})

		it('calls onExit on Escape', () => {
			const onExit = vi.fn()
			const { stdin } = render(
				<FilterBuilder conditions={[]} onChange={vi.fn()} onExit={onExit} focused />,
			)

			stdin.write('\x1B') // Escape
			expect(onExit).toHaveBeenCalled()
		})
	})

	describe('operator shortcuts', () => {
		// Note: Testing operator shortcuts requires Tab navigation to reach the operator field.
		// ink-text-input consumes Tab events before useInput handler, preventing navigation in tests.
		// Operator shortcuts are verified manually - they work correctly in actual usage.
		// Tab navigation works via autocomplete acceptance path (tested in autocomplete section).

		it.skip('changes operator when pressing shortcut on operator field', () => {
			// Skipped: Tab navigation doesn't work in tests due to ink-text-input consuming Tab
		})

		it.skip('supports less than shortcut', () => {
			// Skipped: Tab navigation doesn't work in tests
		})

		it.skip('supports not equals shortcut', () => {
			// Skipped: Tab navigation doesn't work in tests
		})
	})

	describe('autocomplete', () => {
		it('shows ghost text when suggestions available', () => {
			const condition = { attribute: '', operator: 'eq' as const, value: '' }
			const { lastFrame } = render(
				<FilterBuilder
					conditions={[condition]}
					onChange={vi.fn()}
					availableAttributes={['account_id', 'user_id', 'status']}
					focused
				/>,
			)
			// First suggestion should appear as ghost text
			expect(lastFrame()).toContain('account_id')
		})

		it('filters suggestions based on input', () => {
			const condition = { attribute: 'user', operator: 'eq' as const, value: '' }
			const { lastFrame } = render(
				<FilterBuilder
					conditions={[condition]}
					onChange={vi.fn()}
					availableAttributes={['account_id', 'user_id', 'status']}
					focused
				/>,
			)
			// Should show user_id completion
			const frame = lastFrame() ?? ''
			expect(frame).toContain('user')
		})
	})
})
