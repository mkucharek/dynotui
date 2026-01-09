import { render } from 'ink-testing-library'
import { describe, expect, it, vi } from 'vitest'
import { withTestWrapper } from '../../tests/test-utils.js'
import { type SidebarItem, SidebarSection } from './sidebar-section.js'

const mockItems: SidebarItem[] = [
	{ id: 'item1', label: 'First Item' },
	{ id: 'item2', label: 'Second Item', secondary: 'extra' },
	{ id: 'item3', label: 'Third Item' },
]

describe('SidebarSection', () => {
	it('renders title with expand indicator', () => {
		const { lastFrame } = render(
			withTestWrapper(<SidebarSection title="Test Section" items={[]} />),
		)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('▾')
		expect(frame).toContain('Test Section')
	})

	it('shows item count', () => {
		const { lastFrame } = render(
			withTestWrapper(<SidebarSection title="Items" items={mockItems} />),
		)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('3')
	})

	it('renders items', () => {
		const { lastFrame } = render(
			withTestWrapper(<SidebarSection title="Items" items={mockItems} />),
		)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('First Item')
		expect(frame).toContain('Second Item')
		expect(frame).toContain('Third Item')
	})

	it('shows secondary text', () => {
		const { lastFrame } = render(
			withTestWrapper(<SidebarSection title="Items" items={mockItems} />),
		)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('extra')
	})

	it('shows active indicator', () => {
		const { lastFrame } = render(
			withTestWrapper(<SidebarSection title="Items" items={mockItems} activeId="item2" />),
		)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('●')
	})

	it('shows selection indicator when focused', () => {
		const { lastFrame } = render(
			withTestWrapper(
				<SidebarSection title="Items" items={mockItems} selectedIndex={0} focused={true} />,
			),
		)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('▸')
	})

	it('shows empty state', () => {
		const { lastFrame } = render(withTestWrapper(<SidebarSection title="Empty" items={[]} />))
		const frame = lastFrame() ?? ''
		expect(frame).toContain('No items')
	})

	it('handles keyboard navigation', () => {
		const onSelect = vi.fn()
		const { stdin } = render(
			withTestWrapper(
				<SidebarSection
					title="Items"
					items={mockItems}
					selectedIndex={0}
					onSelect={onSelect}
					focused={true}
				/>,
			),
		)

		stdin.write('j')
		expect(onSelect).toHaveBeenCalledWith(1)
	})

	it('handles enter key', () => {
		const onEnter = vi.fn()
		const { stdin } = render(
			withTestWrapper(
				<SidebarSection
					title="Items"
					items={mockItems}
					selectedIndex={1}
					onEnter={onEnter}
					focused={true}
				/>,
			),
		)

		stdin.write('\r')
		expect(onEnter).toHaveBeenCalledWith(mockItems[1])
	})

	it('respects maxVisibleItems', () => {
		const manyItems: SidebarItem[] = Array.from({ length: 10 }, (_, i) => ({
			id: `item${i}`,
			label: `Item ${i}`,
		}))

		const { lastFrame } = render(
			withTestWrapper(<SidebarSection title="Items" items={manyItems} maxVisibleItems={3} />),
		)
		const frame = lastFrame() ?? ''
		// Should show count
		expect(frame).toContain('10')
	})

	it('uses edge-based scrolling (viewport stable when selection moves within view)', () => {
		const manyItems: SidebarItem[] = Array.from({ length: 10 }, (_, i) => ({
			id: `item${i}`,
			label: `Item ${i}`,
		}))

		// Start with selection at index 5, viewport should show items around it
		const { lastFrame, rerender } = render(
			withTestWrapper(
				<SidebarSection items={manyItems} selectedIndex={5} maxVisibleItems={5} focused={true} />,
			),
		)

		let frame = lastFrame() ?? ''
		// Item 5 should be visible
		expect(frame).toContain('Item 5')

		// Move selection up to index 4 - viewport should stay stable
		rerender(
			withTestWrapper(
				<SidebarSection items={manyItems} selectedIndex={4} maxVisibleItems={5} focused={true} />,
			),
		)

		frame = lastFrame() ?? ''
		expect(frame).toContain('Item 4')
		expect(frame).toContain('Item 5') // Item 5 should still be visible (no viewport jump)
	})

	it('truncates long labels with ellipsis', () => {
		const longItems: SidebarItem[] = [
			{ id: 'long', label: 'very-long-profile-name-that-exceeds-sidebar', secondary: 'us-east-1' },
		]

		const { lastFrame } = render(withTestWrapper(<SidebarSection items={longItems} />))
		const frame = lastFrame() ?? ''
		// Should contain truncation ellipsis
		expect(frame).toContain('…')
	})

	it('shows error message', () => {
		const { lastFrame } = render(
			withTestWrapper(<SidebarSection title="Items" items={[]} error="Token expired" />),
		)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('Token expired')
		expect(frame).not.toContain('No items')
	})

	it('shows loading state', () => {
		const { lastFrame } = render(
			withTestWrapper(<SidebarSection title="Items" items={[]} isLoading={true} />),
		)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('Loading...')
		expect(frame).not.toContain('No items')
	})

	it('shows items over loading when items exist', () => {
		const { lastFrame } = render(
			withTestWrapper(<SidebarSection title="Items" items={mockItems} isLoading={true} />),
		)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('First Item')
		expect(frame).not.toContain('Loading...')
	})
})
