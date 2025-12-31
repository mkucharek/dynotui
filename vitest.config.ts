import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		passWithNoTests: true,
		include: ['src/**/*.test.{ts,tsx}'],
		exclude: ['src/tests/e2e/**'],
		environmentMatchGlobs: [['src/store/**/*.test.ts', 'jsdom']],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'src/**/*.test.{ts,tsx}',
				'src/index.tsx',
				'src/app.tsx',
				'src/commands/**',
				'src/components/**',
				'src/views/**',
				'src/**/index.ts',
			],
			thresholds: {
				lines: 60,
				functions: 60,
				branches: 55,
				statements: 60,
			},
		},
	},
})
