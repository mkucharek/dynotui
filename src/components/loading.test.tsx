import { render } from 'ink-testing-library'
import { describe, expect, it } from 'vitest'
import { Loading } from './loading.js'

describe('Loading', () => {
	it('renders default message', () => {
		const { lastFrame } = render(<Loading />)
		expect(lastFrame()).toContain('Loading...')
	})

	it('renders custom message', () => {
		const { lastFrame } = render(<Loading message="Fetching tables..." />)
		expect(lastFrame()).toContain('Fetching tables...')
	})
})
