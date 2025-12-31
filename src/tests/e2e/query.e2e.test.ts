import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDriver, type TmuxDriver } from './helpers/tmux-driver.js'

const TEST_TABLE = 'e2e-test-table'

describe('Query Form E2E', () => {
	let driver: TmuxDriver

	beforeEach(async () => {
		driver = createDriver({ sessionName: 'dyno_query_test' })
		await driver.start()
		await driver.navigateToTable(TEST_TABLE)
		// Open query form
		driver.sendKeys('q')
		await driver.waitFor('Query', { timeout: 3000 })
	})

	afterEach(() => {
		driver.cleanup()
	})

	it('shows query form with partition key card', async () => {
		driver.assertVisible('Partition Key')
		driver.assertVisible('pk:')
	})

	it('shows sort key card with operator dropdown', async () => {
		driver.assertVisible('Sort Key')
		driver.assertVisible('Operator:')
		const screen = driver.capture()
		expect(screen).toContain('= ▾') // Operator dropdown
	})

	it('shows help hints in footer', async () => {
		driver.assertVisible('Tab Next field')
		driver.assertVisible('Enter Submit')
		driver.assertVisible('Esc Cancel')
	})

	it('can cancel query form with Escape', async () => {
		driver.sendSpecialKey('Escape')
		await driver.waitFor('q Query', { timeout: 2000 })
		// Should be back to table view
		driver.assertNotVisible('Partition Key')
	})

	it('can type partition key value', async () => {
		driver.sendKeys('user_001')
		await driver.tick()
		driver.assertVisible('user_001')
	})

	it('submits query on Enter from PK field', async () => {
		driver.sendKeys('user_001')
		await driver.tick()
		driver.sendSpecialKey('Enter')
		await driver.waitFor('Scanned:', { timeout: 5000 })
		// Should be back in results view with query result
		driver.assertVisible('pk = "user_001"')
	})

	it('populates form with previous query values', async () => {
		// First query
		driver.sendKeys('user_002')
		await driver.tick()
		driver.sendSpecialKey('Enter')
		await driver.waitFor('Scanned:', { timeout: 5000 })

		// Open query form again
		driver.sendKeys('q')
		await driver.waitFor('Partition Key', { timeout: 3000 })

		// Should show previous value
		driver.assertVisible('user_002')
	})

	it('navigates to operator with Tab', async () => {
		driver.sendKeys('user_001')
		await driver.tick()
		driver.sendSpecialKey('Tab')
		await driver.tick()
		const screen = driver.capture()
		// Operator should be focused (shows shortcut hint)
		expect(screen).toContain('[=]')
	})

	it('changes operator with arrow keys', async () => {
		driver.sendSpecialKey('Tab') // Move to operator
		await driver.tick()
		driver.sendSpecialKey('Down') // Cycle operator
		await driver.tick()
		const screen = driver.capture()
		// Operator should have changed from = to < (shows with shortcut hint when focused)
		expect(screen).toContain('< [<]')
	})

	it('changes operator with shortcut keys', async () => {
		driver.sendSpecialKey('Tab') // Move to operator
		await driver.tick()
		driver.sendKeys('>') // Press > shortcut
		await driver.tick()
		const screen = driver.capture()
		// Operator shows with shortcut hint when focused
		expect(screen).toContain('> [>]')
	})

	it('navigates to sort key value with Tab', async () => {
		driver.sendKeys('user_001')
		await driver.tick()
		driver.sendSpecialKey('Tab') // Operator
		await driver.tick()
		driver.sendSpecialKey('Tab') // SK value
		await driver.tick()
		driver.sendKeys('event_0001')
		await driver.tick()
		driver.assertVisible('event_0001')
	})

	it('navigates backwards with Shift+Tab', async () => {
		driver.sendKeys('pk_val')
		await driver.tick()
		driver.sendSpecialKey('Tab') // Operator
		await driver.tick()
		driver.sendSpecialKey('Tab') // SK value
		await driver.tick()
		// Send Shift+Tab (BackTab in tmux)
		driver.sendSpecialKey('BTab')
		await driver.tick()
		const screen = driver.capture()
		// Should show operator shortcut hint (means it's focused)
		expect(screen).toContain('[=]')
	})

	it('shows second value field for between operator', async () => {
		driver.sendSpecialKey('Tab') // Move to operator
		await driver.tick()
		driver.sendKeys('b') // Press 'b' for between
		await driver.tick()
		driver.assertVisible('between')
		driver.assertVisible('and:')
	})

	it('opens filter section with f key on last field', async () => {
		driver.sendKeys('user_001')
		await driver.tick()
		driver.sendSpecialKey('Tab') // Operator
		await driver.tick()
		driver.sendSpecialKey('Tab') // SK value
		await driver.tick()
		driver.sendKeys('f') // Open filters
		await driver.waitFor('Filters', { timeout: 2000 })
		driver.assertVisible('#1') // Filter row
		driver.assertVisible('+ Add')
	})
})
