import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['src/tests/e2e/**/*.e2e.test.ts'],
		// Run e2e tests sequentially to avoid tmux/resource conflicts
		fileParallelism: false,
		sequence: {
			concurrent: false,
		},
		// Longer timeouts for e2e tests (includes DynamoDB network latency)
		testTimeout: 30000,
		hookTimeout: 60000,
		// Retry flaky tests once
		retry: 1,
	},
})
