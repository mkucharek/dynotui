import { render } from 'ink-testing-library'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../store/app-store.js'
import { Header } from './header.js'

describe('Header', () => {
	beforeEach(() => {
		useAppStore.setState({
			profile: undefined,
			region: 'us-east-1',
			currentView: { view: 'home' },
			history: [],
		})
	})

	it('renders app name', () => {
		const { lastFrame } = render(<Header />)
		expect(lastFrame()).toContain('DynoTUI')
	})

	it('shows default profile when none set', () => {
		const { lastFrame } = render(<Header />)
		expect(lastFrame()).toContain('default')
	})

	it('shows custom profile when set', () => {
		useAppStore.setState({ profile: 'prod' })
		const { lastFrame } = render(<Header />)
		expect(lastFrame()).toContain('prod')
	})

	it('shows region', () => {
		const { lastFrame } = render(<Header />)
		expect(lastFrame()).toContain('us-east-1')
	})
})
