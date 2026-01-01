import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TERMINAL } from '../constants/terminal.js'

// Mock stdout before importing the module
const mockStdout = {
	columns: 100,
	rows: 30,
	on: vi.fn(),
	off: vi.fn(),
}

vi.mock('node:process', () => ({
	stdout: mockStdout,
}))

// Import after mocking
const { getTerminalSize } = await import('./use-terminal-size.js')

describe('getTerminalSize', () => {
	beforeEach(() => {
		// Reset mock values
		mockStdout.columns = 100
		mockStdout.rows = 30
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it('returns correct dimensions', () => {
		mockStdout.columns = 120
		mockStdout.rows = 40

		const size = getTerminalSize()

		expect(size.width).toBe(120)
		expect(size.height).toBe(40)
	})

	it('calculates contentHeight correctly', () => {
		mockStdout.columns = 100
		mockStdout.rows = 30

		const size = getTerminalSize()

		expect(size.contentHeight).toBe(30 - TERMINAL.FRAME_OVERHEAD)
	})

	it('uses default sidebar width for normal terminals', () => {
		mockStdout.columns = 100
		mockStdout.rows = 30

		const size = getTerminalSize()

		expect(size.sidebarWidth).toBe(TERMINAL.SIDEBAR_WIDTH)
	})

	it('uses compact sidebar width for narrow terminals', () => {
		mockStdout.columns = 70 // Below MIN_WIDTH
		mockStdout.rows = 30

		const size = getTerminalSize()

		expect(size.sidebarWidth).toBe(TERMINAL.SIDEBAR_WIDTH_COMPACT)
	})

	it('calculates mainWidth correctly', () => {
		mockStdout.columns = 100
		mockStdout.rows = 30

		const size = getTerminalSize()

		// mainWidth = width - sidebarWidth - 3
		expect(size.mainWidth).toBe(100 - TERMINAL.SIDEBAR_WIDTH - 3)
	})

	it('returns isTooSmall=true when width below minimum', () => {
		mockStdout.columns = 70
		mockStdout.rows = 30

		const size = getTerminalSize()

		expect(size.isTooSmall).toBe(true)
	})

	it('returns isTooSmall=true when height below minimum', () => {
		mockStdout.columns = 100
		mockStdout.rows = 15

		const size = getTerminalSize()

		expect(size.isTooSmall).toBe(true)
	})

	it('returns isTooSmall=false when dimensions meet minimum', () => {
		mockStdout.columns = TERMINAL.MIN_WIDTH
		mockStdout.rows = TERMINAL.MIN_HEIGHT

		const size = getTerminalSize()

		expect(size.isTooSmall).toBe(false)
	})

	it('ensures contentHeight is at least 1', () => {
		mockStdout.columns = 100
		mockStdout.rows = 1 // Very small

		const size = getTerminalSize()

		expect(size.contentHeight).toBe(1)
	})

	it('ensures mainWidth is at least 1', () => {
		mockStdout.columns = 10 // Very narrow
		mockStdout.rows = 30

		const size = getTerminalSize()

		expect(size.mainWidth).toBe(1)
	})

	it('defaults to 80x24 when stdout dimensions unavailable', () => {
		mockStdout.columns = undefined as unknown as number
		mockStdout.rows = undefined as unknown as number

		const size = getTerminalSize()

		expect(size.width).toBe(80)
		expect(size.height).toBe(24)
	})
})
