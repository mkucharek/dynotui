import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDriver, type TmuxDriver } from './helpers/tmux-driver.js'

const TEST_TABLE = 'e2e-test-table'

describe('Table View E2E', () => {
	let driver: TmuxDriver

	beforeEach(async () => {
		driver = createDriver({ sessionName: 'dyno_table_test' })
		await driver.start()
		await driver.navigateToTable(TEST_TABLE)
	})

	afterEach(() => {
		driver.cleanup()
	})

	it('shows table name in header', async () => {
		const screen = driver.capture()
		// Header shows table name and scan mode
		expect(screen).toContain('scan')
	})

	it('shows table metadata (PK, SK, item count)', async () => {
		// Data already loaded in beforeEach via navigateToTable
		const screen = driver.capture()
		expect(screen).toContain('PK:')
		expect(screen).toContain('items')
	})

	it('shows data table with rows', async () => {
		const screen = driver.capture()
		// Should have table separator line
		expect(screen).toContain('───')
	})

	it('shows table view footer keybindings', async () => {
		driver.assertVisible('j/k Navigate')
		driver.assertVisible('Enter View')
		driver.assertVisible('s Scan')
		driver.assertVisible('f Filter')
		driver.assertVisible('Esc Back')
	})

	it('can navigate rows with j/k', async () => {
		driver.sendKeys('j')
		await driver.tick()
		// Screen should still show table content
		driver.assertVisible('scan')
	})

	it('can go back to home with Escape', async () => {
		driver.sendSpecialKey('Escape')
		await driver.waitFor('[1]  Profile', { timeout: 3000 })
		driver.assertVisible('Tables')
	})

	it('can refresh scan with s key', async () => {
		driver.sendKeys('s')
		await driver.tick(500)
		// Should still be in scan mode
		driver.assertVisible('scan')
	})

	it('can open query form with q key', async () => {
		driver.sendKeys('q')
		await driver.waitFor('Query', { timeout: 2000 })
		// Query form should be visible
		const screen = driver.capture()
		expect(screen).toContain('Query')
	})

	it('can cancel query form with Escape', async () => {
		driver.sendKeys('q')
		await driver.waitFor('Query', { timeout: 2000 })
		driver.sendSpecialKey('Escape')
		await driver.waitFor('f Filter', { timeout: 2000 })
	})

	it('shows item count in metadata', async () => {
		// Data already loaded in beforeEach via navigateToTable
		const screen = driver.capture()
		// Should show item count in the table header metadata
		expect(screen).toMatch(/\d+.*items|items.*\d+/i)
	})
})
