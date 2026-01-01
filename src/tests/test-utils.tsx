import type { ReactNode } from 'react'
import { TerminalProvider } from '../contexts/terminal-context.js'

/**
 * Wrapper component that provides terminal context for tests.
 * Use this with ink-testing-library render.
 */
export function TestWrapper({ children }: { children: ReactNode }) {
	return <TerminalProvider>{children}</TerminalProvider>
}

/**
 * Wraps a component with the test providers.
 */
export function withTestWrapper(component: ReactNode): ReactNode {
	return <TestWrapper>{component}</TestWrapper>
}
