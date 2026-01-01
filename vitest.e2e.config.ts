import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['src/tests/e2e/**/*.e2e.test.ts'],
		// Run test files in parallel (each uses unique tmux session, read-only DB access)
		fileParallelism: true,
		// Limit workers to avoid overwhelming system with concurrent tmux/TUI processes
		maxWorkers: 3,
		sequence: {
			// Keep tests within same file sequential for predictable state
			concurrent: false,
		},
		// Longer timeouts for e2e tests (includes DynamoDB network latency)
		testTimeout: 30000,
		hookTimeout: 60000,
		// Retry flaky tests once
		retry: 1,
	},
})
