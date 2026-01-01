import { createContext, type ReactNode, useContext } from 'react'
import { type TerminalSize, useTerminalSize } from '../hooks/use-terminal-size.js'

const TerminalContext = createContext<TerminalSize | null>(null)

export type TerminalProviderProps = {
	children: ReactNode
}

/**
 * Provider that makes terminal dimensions available throughout the component tree.
 * Wrap your app with this to enable useTerminal() in child components.
 */
export function TerminalProvider({ children }: TerminalProviderProps) {
	const size = useTerminalSize()
	return <TerminalContext.Provider value={size}>{children}</TerminalContext.Provider>
}

/**
 * Hook to access terminal dimensions from context.
 * Must be used within a TerminalProvider.
 */
export function useTerminal(): TerminalSize {
	const context = useContext(TerminalContext)
	if (!context) {
		throw new Error('useTerminal must be used within a TerminalProvider')
	}
	return context
}
