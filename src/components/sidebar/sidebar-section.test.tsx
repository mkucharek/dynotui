import { render } from 'ink-testing-library'
import { describe, expect, it, vi } from 'vitest'
import { type SidebarItem, SidebarSection } from './sidebar-section.js'

const mockItems: SidebarItem[] = [
	{ id: 'item1', label: 'First Item' },
	{ id: 'item2', label: 'Second Item', secondary: 'extra' },
	{ id: 'item3', label: 'Third Item' },
]

describe('SidebarSection', () => {
	it('renders title with shortcut', () => {
		const { lastFrame } = render(<SidebarSection shortcut="1" title="Test Section" items={[]} />)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('[1]')
		expect(frame).toContain('Test Section')
	})

	it('shows item count', () => {
		const { lastFrame } = render(<SidebarSection shortcut="1" title="Items" items={mockItems} />)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('(3)')
	})

	it('renders items', () => {
		const { lastFrame } = render(<SidebarSection shortcut="1" title="Items" items={mockItems} />)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('First Item')
		expect(frame).toContain('Second Item')
		expect(frame).toContain('Third Item')
	})

	it('shows secondary text', () => {
		const { lastFrame } = render(<SidebarSection shortcut="1" title="Items" items={mockItems} />)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('extra')
	})

	it('shows active indicator', () => {
		const { lastFrame } = render(
			<SidebarSection shortcut="1" title="Items" items={mockItems} activeId="item2" />,
		)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('◄')
	})

	it('shows selection indicator when focused', () => {
		const { lastFrame } = render(
			<SidebarSection
				shortcut="1"
				title="Items"
				items={mockItems}
				selectedIndex={0}
				focused={true}
			/>,
		)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('>')
	})

	it('shows empty state', () => {
		const { lastFrame } = render(<SidebarSection shortcut="1" title="Empty" items={[]} />)
		const frame = lastFrame() ?? ''
		expect(frame).toContain('No items')
	})

	it('handles keyboard navigation', () => {
		const onSelect = vi.fn()
		const { stdin } = render(
			<SidebarSection
				shortcut="1"
				title="Items"
				items={mockItems}
				selectedIndex={0}
				onSelect={onSelect}
				focused={true}
			/>,
		)

		stdin.write('j')
		expect(onSelect).toHaveBeenCalledWith(1)
	})

	it('handles enter key', () => {
		const onEnter = vi.fn()
		const { stdin } = render(
			<SidebarSection
				shortcut="1"
				title="Items"
				items={mockItems}
				selectedIndex={1}
				onEnter={onEnter}
				focused={true}
			/>,
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
			<SidebarSection shortcut="1" title="Items" items={manyItems} maxVisibleItems={3} />,
		)
		const frame = lastFrame() ?? ''
		// Should show count but limit visible items
		expect(frame).toContain('(10)')
	})
})
