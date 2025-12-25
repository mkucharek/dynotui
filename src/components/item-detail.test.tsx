import { render } from 'ink-testing-library'
import { describe, expect, it } from 'vitest'
import { ItemDetail } from './item-detail.js'

describe('ItemDetail', () => {
	it('renders simple object', () => {
		const { lastFrame } = render(<ItemDetail item={{ name: 'Alice', age: 30 }} />)
		expect(lastFrame()).toContain('"name"')
		expect(lastFrame()).toContain('"Alice"')
		expect(lastFrame()).toContain('"age"')
		expect(lastFrame()).toContain('30')
	})

	it('renders nested object', () => {
		const { lastFrame } = render(<ItemDetail item={{ user: { name: 'Bob' } }} />)
		expect(lastFrame()).toContain('"user"')
		expect(lastFrame()).toContain('"name"')
		expect(lastFrame()).toContain('"Bob"')
	})

	it('renders array', () => {
		const { lastFrame } = render(<ItemDetail item={{ tags: ['a', 'b'] }} />)
		expect(lastFrame()).toContain('"tags"')
		expect(lastFrame()).toContain('[')
		expect(lastFrame()).toContain('"a"')
		expect(lastFrame()).toContain('"b"')
		expect(lastFrame()).toContain(']')
	})

	it('renders null and boolean values', () => {
		const { lastFrame } = render(<ItemDetail item={{ active: true, deleted: null }} />)
		expect(lastFrame()).toContain('true')
		expect(lastFrame()).toContain('null')
	})

	it('renders empty object', () => {
		const { lastFrame } = render(<ItemDetail item={{}} />)
		expect(lastFrame()).toContain('{}')
	})

	it('scrolls with j/k keys', () => {
		const bigItem: Record<string, string> = {}
		for (let i = 0; i < 50; i++) {
			bigItem[`key${i}`] = `value${i}`
		}

		const { lastFrame, stdin } = render(<ItemDetail item={bigItem} maxHeight={10} />)

		// Initially shows first lines
		expect(lastFrame()).toContain('"key0"')

		// Scroll down
		stdin.write('j')
		stdin.write('j')
		stdin.write('j')

		const frameAfterScroll = lastFrame()
		// Should show scroll indicator
		expect(frameAfterScroll).toContain('Lines')
	})
})
