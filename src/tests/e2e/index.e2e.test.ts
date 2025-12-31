import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDriver, type TmuxDriver } from './helpers/tmux-driver.js'

describe('GSI/LSI Index E2E', () => {
	let driver: TmuxDriver

	beforeEach(async () => {
		driver = createDriver({ sessionName: 'dyno_index_test' })
		await driver.start()
	})

	afterEach(() => {
		driver.cleanup()
	})

	describe('Query Form Index Selection', () => {
		it('shows index selector for table with indexes', async () => {
			await driver.navigateToTable('orders')
			driver.sendKeys('q')
			await driver.waitFor('› Query', { timeout: 3000 })

			const screen = driver.capture()
			// Should show index card with Base Table and GSI
			expect(screen).toContain('Index')
			expect(screen).toContain('Base Table')
			expect(screen).toContain('GSI:')
			expect(screen).toContain('customer-orders-index')
		})

		it('shows key schema in index selector', async () => {
			await driver.navigateToTable('orders')
			driver.sendKeys('q')
			await driver.waitFor('› Query', { timeout: 3000 })

			const screen = driver.capture()
			// Base table keys
			expect(screen).toContain('order_id')
			// GSI keys
			expect(screen).toContain('customer_id')
		})

		it('updates PK/SK labels when selecting index with j key', async () => {
			await driver.navigateToTable('orders')
			driver.sendKeys('q')
			await driver.waitFor('› Query', { timeout: 3000 })

			// Initially on base table - PK should be order_id
			let screen = driver.capture()
			expect(screen).toContain('order_id:')

			// Move to GSI and select
			driver.sendKeys('j')
			await driver.tick()
			driver.sendSpecialKey('Enter')
			await driver.tick()

			// Now PK should be customer_id (GSI's partition key)
			screen = driver.capture()
			expect(screen).toContain('customer_id:')
		})

		it('shows both GSI and LSI for products table', async () => {
			await driver.navigateToTable('products')
			driver.sendKeys('q')
			await driver.waitFor('› Query', { timeout: 3000 })

			const screen = driver.capture()
			expect(screen).toContain('Base Table')
			expect(screen).toContain('GSI:')
			expect(screen).toContain('category-index')
			expect(screen).toContain('LSI:')
			expect(screen).toContain('price-index')
		})
	})

	describe('Query with Index', () => {
		it('executes query on GSI and shows index in summary', async () => {
			await driver.navigateToTable('orders')
			driver.sendKeys('q')
			await driver.waitFor('› Query', { timeout: 3000 })

			// Select GSI
			driver.sendKeys('j')
			await driver.tick()
			driver.sendSpecialKey('Enter')
			await driver.tick()

			// Enter customer_id value
			driver.sendKeys('CUST-001')
			await driver.tick()
			driver.sendSpecialKey('Enter')
			await driver.waitFor('Query:', { timeout: 5000 })

			// Should show index name in summary
			const screen = driver.capture()
			expect(screen).toContain('[customer-orders-index]')
			expect(screen).toContain('customer_id')
		})
	})

	describe('Index Count Display', () => {
		it('shows index count in metadata bar', async () => {
			await driver.navigateToTable('orders')
			await driver.waitFor('scan', { timeout: 3000 })

			// orders has 1 GSI
			driver.assertVisible('1 index')
		})

		it('shows plural indexes for multiple', async () => {
			await driver.navigateToTable('products')
			await driver.waitFor('scan', { timeout: 3000 })

			// products has 1 GSI + 1 LSI = 2 indexes
			driver.assertVisible('2 indexes')
		})
	})

	describe('Table without Indexes', () => {
		it('does not show index selector', async () => {
			await driver.navigateToTable('e2e-test-table')
			driver.sendKeys('q')
			await driver.waitFor('› Query', { timeout: 3000 })

			// Should go straight to PK field, no index card
			const screen = driver.capture()
			expect(screen).not.toContain('GSI:')
			expect(screen).not.toContain('LSI:')
			// Should still show partition key field (e2e-test-table uses 'pk')
			expect(screen).toContain('pk:')
		})
	})
})
