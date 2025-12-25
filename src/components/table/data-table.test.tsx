import { render } from 'ink-testing-library'
import { describe, expect, it, vi } from 'vitest'
import { DataTable } from './data-table.js'

describe('DataTable', () => {
	const sampleData = [
		{ id: '1', name: 'Alice', email: 'alice@example.com' },
		{ id: '2', name: 'Bob', email: 'bob@example.com' },
	]

	it('shows empty message when no data', () => {
		const { lastFrame } = render(<DataTable data={[]} />)
		expect(lastFrame()).toContain('No data')
	})

	it('auto-generates columns from data', () => {
		const { lastFrame } = render(<DataTable data={sampleData} />)
		expect(lastFrame()).toContain('id')
		expect(lastFrame()).toContain('name')
		expect(lastFrame()).toContain('Alice')
		expect(lastFrame()).toContain('Bob')
	})

	it('uses custom columns when provided', () => {
		const { lastFrame } = render(
			<DataTable
				data={sampleData}
				columns={[
					{ key: 'name', header: 'Full Name' },
					{ key: 'email', header: 'Email Address' },
				]}
			/>,
		)
		expect(lastFrame()).toContain('Full Name')
		expect(lastFrame()).toContain('Email Address')
		expect(lastFrame()).not.toContain('id')
	})

	it('navigates with j/k keys', () => {
		const onSelect = vi.fn()
		const { stdin } = render(<DataTable data={sampleData} selectedIndex={0} onSelect={onSelect} />)

		stdin.write('j')
		expect(onSelect).toHaveBeenCalledWith(1)
	})

	it('calls onEnter when pressing enter', () => {
		const onEnter = vi.fn()
		const { stdin } = render(<DataTable data={sampleData} selectedIndex={0} onEnter={onEnter} />)

		stdin.write('\r')
		expect(onEnter).toHaveBeenCalledWith(sampleData[0], 0)
	})

	it('renders with custom render function', () => {
		const { lastFrame } = render(
			<DataTable
				data={sampleData}
				columns={[{ key: 'name', header: 'Name', render: (v) => `** ${v} **` }]}
			/>,
		)
		expect(lastFrame()).toContain('** Alice **')
	})
})
