import { render } from 'ink-testing-library'
import { describe, expect, it, vi } from 'vitest'
import { buildIndexItems, IndexSelector, type IndexSelectorItem } from './index-selector.js'

describe('buildIndexItems', () => {
	it('returns base table item when no indexes', () => {
		const items = buildIndexItems([], 'pk', 'sk')
		expect(items).toEqual([
			{
				value: '',
				label: 'Base Table',
				type: 'base',
				pkName: 'pk',
				skName: 'sk',
			},
		])
	})

	it('includes base table and GSI', () => {
		const indexes = [
			{
				name: 'customer-index',
				type: 'GSI' as const,
				partitionKey: 'customer_id',
				sortKey: 'order_date',
				projection: 'ALL' as const,
				status: 'ACTIVE' as const,
			},
		]
		const items = buildIndexItems(indexes, 'order_id', 'item_id')

		expect(items).toHaveLength(2)
		expect(items[0]).toEqual({
			value: '',
			label: 'Base Table',
			type: 'base',
			pkName: 'order_id',
			skName: 'item_id',
		})
		expect(items[1]).toEqual({
			value: 'customer-index',
			label: 'customer-index',
			type: 'GSI',
			pkName: 'customer_id',
			skName: 'order_date',
		})
	})

	it('handles LSI without sort key', () => {
		const indexes = [
			{
				name: 'simple-index',
				type: 'LSI' as const,
				partitionKey: 'pk',
				projection: 'ALL' as const,
			},
		]
		const items = buildIndexItems(indexes, 'pk', 'sk')

		expect(items[1]).toEqual({
			value: 'simple-index',
			label: 'simple-index',
			type: 'LSI',
			pkName: 'pk',
			skName: undefined,
		})
	})

	it('handles base table without sort key', () => {
		const items = buildIndexItems([], 'id')
		expect(items[0]?.skName).toBeUndefined()
	})
})

describe('IndexSelector', () => {
	const mockItems: IndexSelectorItem[] = [
		{ value: '', label: 'Base Table', type: 'base', pkName: 'pk', skName: 'sk' },
		{ value: 'gsi-1', label: 'gsi-1', type: 'GSI', pkName: 'attr1', skName: 'attr2' },
		{ value: 'lsi-1', label: 'lsi-1', type: 'LSI', pkName: 'pk', skName: 'attr3' },
	]

	it('renders all items', () => {
		const { lastFrame } = render(
			<IndexSelector items={mockItems} selectedValue="" onChange={() => {}} />,
		)
		const output = lastFrame()

		expect(output).toContain('Base Table')
		expect(output).toContain('gsi-1')
		expect(output).toContain('lsi-1')
	})

	it('displays type prefix for GSI and LSI', () => {
		const { lastFrame } = render(
			<IndexSelector items={mockItems} selectedValue="" onChange={() => {}} />,
		)
		const output = lastFrame()

		expect(output).toContain('GSI:')
		expect(output).toContain('LSI:')
	})

	it('displays key schema in parentheses', () => {
		const { lastFrame } = render(
			<IndexSelector items={mockItems} selectedValue="" onChange={() => {}} />,
		)
		const output = lastFrame()

		expect(output).toContain('(pk + sk)')
		expect(output).toContain('(attr1 + attr2)')
	})

	it('shows single key when no sort key', () => {
		const items: IndexSelectorItem[] = [
			{ value: '', label: 'Base Table', type: 'base', pkName: 'id' },
		]
		const { lastFrame } = render(
			<IndexSelector items={items} selectedValue="" onChange={() => {}} />,
		)

		expect(lastFrame()).toContain('(id)')
		expect(lastFrame()).not.toContain('+')
	})

	it('calls onChange with selected item on Enter', () => {
		const onChange = vi.fn()
		const { stdin } = render(
			<IndexSelector items={mockItems} selectedValue="" onChange={onChange} focused />,
		)

		stdin.write('\r') // Enter key
		expect(onChange).toHaveBeenCalledWith(mockItems[0])
	})

	it('navigates down with j key', async () => {
		const onChange = vi.fn()
		const { stdin } = render(
			<IndexSelector items={mockItems} selectedValue="" onChange={onChange} focused />,
		)

		stdin.write('j') // Move down
		await new Promise((r) => setTimeout(r, 50))
		stdin.write('\r') // Select
		expect(onChange).toHaveBeenCalledWith(mockItems[1])
	})

	it('navigates up with k key', async () => {
		const onChange = vi.fn()
		const { stdin } = render(
			<IndexSelector items={mockItems} selectedValue="" onChange={onChange} focused />,
		)

		stdin.write('j') // Move to index 1
		await new Promise((r) => setTimeout(r, 20))
		stdin.write('j') // Move to index 2
		await new Promise((r) => setTimeout(r, 20))
		stdin.write('k') // Move back to index 1
		await new Promise((r) => setTimeout(r, 20))
		stdin.write('\r') // Select
		expect(onChange).toHaveBeenCalledWith(mockItems[1])
	})

	it('does not navigate past last item', async () => {
		const onChange = vi.fn()
		const { stdin } = render(
			<IndexSelector items={mockItems} selectedValue="" onChange={onChange} focused />,
		)

		stdin.write('j')
		await new Promise((r) => setTimeout(r, 10))
		stdin.write('j')
		await new Promise((r) => setTimeout(r, 10))
		stdin.write('j') // Try to go past end
		await new Promise((r) => setTimeout(r, 10))
		stdin.write('\r')
		expect(onChange).toHaveBeenCalledWith(mockItems[2]) // Should stay at last item
	})

	it('does not navigate before first item', () => {
		const onChange = vi.fn()
		const { stdin } = render(
			<IndexSelector items={mockItems} selectedValue="" onChange={onChange} focused />,
		)

		stdin.write('k') // Try to go before start
		stdin.write('\r')
		expect(onChange).toHaveBeenCalledWith(mockItems[0]) // Should stay at first item
	})

	it('ignores input when not focused', () => {
		const onChange = vi.fn()
		const { stdin } = render(
			<IndexSelector items={mockItems} selectedValue="" onChange={onChange} focused={false} />,
		)

		stdin.write('j')
		stdin.write('\r')
		expect(onChange).not.toHaveBeenCalled()
	})
})
