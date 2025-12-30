import { render } from 'ink-testing-library'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../store/app-store.js'
import { Footer } from './footer.js'

describe('Footer', () => {
	beforeEach(() => {
		useAppStore.setState({
			profile: undefined,
			region: 'us-east-1',
			currentView: { view: 'home' },
			inputMode: 'sidebar',
		})
	})

	it('renders default sidebar mode bindings', () => {
		const { lastFrame } = render(<Footer />)
		expect(lastFrame()).toContain('j/k')
		expect(lastFrame()).toContain('Navigate')
		expect(lastFrame()).toContain('Enter')
		expect(lastFrame()).toContain('Select')
	})

	it('renders panel keybinding hint', () => {
		const { lastFrame } = render(<Footer />)
		expect(lastFrame()).toContain('1/2/0')
		expect(lastFrame()).toContain('Panel')
	})

	it('renders normal mode bindings from store', () => {
		useAppStore.setState({ inputMode: 'normal' })
		const { lastFrame } = render(<Footer />)
		expect(lastFrame()).toContain('s')
		expect(lastFrame()).toContain('Scan')
		expect(lastFrame()).toContain('q')
		expect(lastFrame()).toContain('Query')
	})

	it('renders custom keybindings', () => {
		const { lastFrame } = render(
			<Footer
				bindings={[
					{ key: 'Enter', label: 'Select' },
					{ key: 's', label: 'Scan' },
				]}
			/>,
		)
		expect(lastFrame()).toContain('Enter')
		expect(lastFrame()).toContain('Select')
		expect(lastFrame()).toContain('s')
		expect(lastFrame()).toContain('Scan')
	})
})
