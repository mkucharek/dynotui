import { render } from 'ink-testing-library'
import { describe, expect, it } from 'vitest'
import { Footer } from './footer.js'

describe('Footer', () => {
	it('renders default keybindings', () => {
		const { lastFrame } = render(<Footer />)
		expect(lastFrame()).toContain('q')
		expect(lastFrame()).toContain('Quit')
		expect(lastFrame()).toContain('Esc')
		expect(lastFrame()).toContain('Back')
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
