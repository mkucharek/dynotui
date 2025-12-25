import { render } from 'ink-testing-library'
import { describe, expect, it, vi } from 'vitest'
import { TableList } from './table-list.js'

describe('TableList', () => {
	it('shows empty message when no tables', () => {
		const { lastFrame } = render(<TableList tables={[]} />)
		expect(lastFrame()).toContain('No tables found')
	})

	it('renders table names', () => {
		const { lastFrame } = render(<TableList tables={['users', 'orders', 'products']} />)
		expect(lastFrame()).toContain('users')
		expect(lastFrame()).toContain('orders')
		expect(lastFrame()).toContain('products')
	})

	it('highlights selected table', () => {
		const { lastFrame } = render(<TableList tables={['users', 'orders']} selectedIndex={0} />)
		expect(lastFrame()).toContain('> users')
	})

	it('navigates with j/k keys', () => {
		const onSelect = vi.fn()
		const { stdin } = render(
			<TableList tables={['users', 'orders']} selectedIndex={0} onSelect={onSelect} />,
		)

		stdin.write('j')
		expect(onSelect).toHaveBeenCalledWith(1)

		onSelect.mockClear()
		stdin.write('k')
		expect(onSelect).toHaveBeenCalledWith(0)
	})

	it('calls onEnter when pressing enter', () => {
		const onEnter = vi.fn()
		const { stdin } = render(
			<TableList tables={['users', 'orders']} selectedIndex={0} onEnter={onEnter} />,
		)

		stdin.write('\r')
		expect(onEnter).toHaveBeenCalledWith('users')
	})
})
