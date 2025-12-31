import { execFileSync } from 'node:child_process'

export type TmuxDriverOptions = {
	sessionName?: string
	width?: number
	height?: number
	startupTimeout?: number
}

export type WaitForOptions = {
	timeout?: number
	interval?: number
}

let sessionCounter = 0

const DEFAULT_OPTIONS: Required<TmuxDriverOptions> = {
	sessionName: 'dyno_e2e',
	width: 120,
	height: 35,
	startupTimeout: 10000,
}

export class TmuxDriver {
	private sessionName: string
	private width: number
	private height: number
	private startupTimeout: number
	private started = false

	constructor(options: TmuxDriverOptions = {}) {
		const opts = { ...DEFAULT_OPTIONS, ...options }
		// Unique session name to avoid collisions between tests
		sessionCounter++
		this.sessionName = `${opts.sessionName}_${sessionCounter}_${Date.now()}`
		this.width = opts.width
		this.height = opts.height
		this.startupTimeout = opts.startupTimeout
	}

	/**
	 * Start the app in a tmux session
	 */
	async start(command = 'pnpm dev'): Promise<void> {
		// Kill any existing session and wait for cleanup
		this.killSession()
		await this.sleep(100)

		// Start new session with the command
		execFileSync(
			'tmux',
			[
				'new-session',
				'-d',
				'-s',
				this.sessionName,
				'-x',
				String(this.width),
				'-y',
				String(this.height),
				command,
			],
			{ stdio: 'ignore' },
		)

		this.started = true

		// Wait for app to initialize (look for the footer which indicates render complete)
		await this.waitFor('Navigate', { timeout: this.startupTimeout })
	}

	/**
	 * Send keystrokes to the app
	 */
	sendKeys(keys: string): void {
		if (!this.started) throw new Error('Driver not started')
		execFileSync('tmux', ['send-keys', '-t', this.sessionName, keys], {
			stdio: 'ignore',
		})
	}

	/**
	 * Send special keys (Enter, Escape, Tab, etc.)
	 */
	sendSpecialKey(
		key: 'Enter' | 'Escape' | 'Tab' | 'Up' | 'Down' | 'Left' | 'Right' | 'BSpace',
	): void {
		if (!this.started) throw new Error('Driver not started')
		execFileSync('tmux', ['send-keys', '-t', this.sessionName, key], {
			stdio: 'ignore',
		})
	}

	/**
	 * Capture current screen content
	 */
	capture(): string {
		if (!this.started) throw new Error('Driver not started')
		return execFileSync('tmux', ['capture-pane', '-t', this.sessionName, '-p'], {
			encoding: 'utf-8',
		})
	}

	/**
	 * Wait for specific text to appear on screen
	 */
	async waitFor(text: string, options: WaitForOptions = {}): Promise<string> {
		const { timeout = 5000, interval = 100 } = options
		const start = Date.now()

		while (Date.now() - start < timeout) {
			const screen = this.capture()
			if (screen.includes(text)) {
				return screen
			}
			await this.sleep(interval)
		}

		const finalScreen = this.capture()
		throw new Error(
			`Timeout waiting for "${text}" after ${timeout}ms.\nCurrent screen:\n${finalScreen}`,
		)
	}

	/**
	 * Wait for text to disappear from screen
	 */
	async waitForGone(text: string, options: WaitForOptions = {}): Promise<string> {
		const { timeout = 5000, interval = 100 } = options
		const start = Date.now()

		while (Date.now() - start < timeout) {
			const screen = this.capture()
			if (!screen.includes(text)) {
				return screen
			}
			await this.sleep(interval)
		}

		throw new Error(`Timeout waiting for "${text}" to disappear after ${timeout}ms`)
	}

	/**
	 * Assert that text is present on screen
	 */
	assertVisible(text: string): void {
		const screen = this.capture()
		if (!screen.includes(text)) {
			throw new Error(`Expected "${text}" to be visible.\nCurrent screen:\n${screen}`)
		}
	}

	/**
	 * Assert that text is NOT present on screen
	 */
	assertNotVisible(text: string): void {
		const screen = this.capture()
		if (screen.includes(text)) {
			throw new Error(`Expected "${text}" to NOT be visible.\nCurrent screen:\n${screen}`)
		}
	}

	/**
	 * Clean up - kill the tmux session
	 */
	cleanup(): void {
		this.killSession()
		this.started = false
	}

	/**
	 * Helper: small delay for UI to update
	 */
	async tick(ms = 200): Promise<void> {
		await this.sleep(ms)
	}

	/**
	 * Navigate to table view and wait for data to load
	 */
	async navigateToTable(tableName: string): Promise<void> {
		// Focus browse panel
		this.sendKeys('2')
		await this.tick(500)

		// Verify table is visible in list
		await this.waitFor(tableName, { timeout: 5000 })

		// Select table
		this.sendSpecialKey('Enter')

		// Wait for table view to load
		await this.waitFor('› scan', { timeout: 10000 })

		// Wait for schema to load (PK: appears in header)
		await this.waitFor('PK:', { timeout: 30000 })

		// Wait for scan to complete (Loading disappears)
		await this.waitForGone('Loading', { timeout: 30000 })
	}

	private killSession(): void {
		try {
			execFileSync('tmux', ['kill-session', '-t', this.sessionName], {
				stdio: 'ignore',
			})
		} catch {
			// Session may not exist, ignore
		}
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}
}

/**
 * Create a driver instance for use in tests
 */
export function createDriver(options?: TmuxDriverOptions): TmuxDriver {
	return new TmuxDriver(options)
}
