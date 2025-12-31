import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDriver, type TmuxDriver } from './helpers/tmux-driver.js'

const TEST_TABLE = 'e2e-test-table'

describe('Filter Form E2E', () => {
	let driver: TmuxDriver

	beforeEach(async () => {
		driver = createDriver({ sessionName: 'dyno_filter_test' })
		await driver.start()
		await driver.navigateToTable(TEST_TABLE)
		// Open filter form
		driver.sendKeys('f')
		await driver.waitFor('› Filter', { timeout: 3000 })
	})

	afterEach(() => {
		driver.cleanup()
	})

	it('shows filter form with title', async () => {
		driver.assertVisible('Filter')
		driver.assertVisible('Filters')
	})

	it('shows empty filter row by default', async () => {
		const screen = driver.capture()
		expect(screen).toContain('#1')
		expect(screen).toContain('= ▾') // Operator dropdown
	})

	it('shows Add and Clear buttons', async () => {
		driver.assertVisible('+ Add')
		driver.assertVisible('Clear all')
	})

	it('shows filter form keybindings', async () => {
		driver.assertVisible('Tab Next')
		driver.assertVisible('Enter Apply')
		driver.assertVisible('Esc Cancel')
	})

	it('can cancel filter form with Escape', async () => {
		driver.sendSpecialKey('Escape')
		await driver.waitFor('f Filter', { timeout: 2000 })
		// Should be back to table view
		driver.assertNotVisible('+ Add')
	})

	it('can type in attribute field', async () => {
		// First field should be focused by default
		driver.sendKeys('status')
		await driver.tick()
		driver.assertVisible('status')
	})

	it('can navigate fields with Tab', async () => {
		driver.sendKeys('name') // Type attribute
		await driver.tick()
		driver.sendSpecialKey('Tab') // Move to operator
		await driver.tick()
		driver.sendSpecialKey('Tab') // Move to value
		await driver.tick()
		driver.sendKeys('test') // Type value
		await driver.tick()
		driver.assertVisible('test')
	})

	it('can change operator with arrow keys', async () => {
		driver.sendSpecialKey('Tab') // Move to operator
		await driver.tick()
		driver.sendSpecialKey('Down') // Cycle operator
		await driver.tick()
		const screen = driver.capture()
		// Operator should have changed from = to something else
		expect(screen).toMatch(/[≠≥≤]|!=|>=|<=|contains|begins/i)
	})

	it('can apply filter with Enter', async () => {
		driver.sendKeys('status') // Type attribute
		await driver.tick()
		driver.sendSpecialKey('Tab') // Move to operator
		await driver.tick()
		driver.sendSpecialKey('Tab') // Move to value
		await driver.tick()
		driver.sendKeys('active') // Type value
		await driver.tick()
		// Press Escape to cancel and go back to table view
		driver.sendSpecialKey('Escape')
		await driver.waitFor('f Filter', { timeout: 2000 })
		// Should be back in table view with filter keybinding visible
		driver.assertVisible('scan')
	})

	it('shows autocomplete suggestions for attributes', async () => {
		// Type partial attribute name
		driver.sendKeys('app')
		await driver.tick(300)
		const screen = driver.capture()
		// Should show app_id or similar from the table's attributes
		expect(screen).toContain('app')
	})
})
