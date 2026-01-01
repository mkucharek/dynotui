import { stdout } from 'node:process'
import { useSyncExternalStore } from 'react'
import { TERMINAL } from '../constants/terminal.js'

export type TerminalSize = {
	/** Raw terminal width in columns */
	width: number
	/** Raw terminal height in rows */
	height: number
	/** Available content height (minus frame overhead) */
	contentHeight: number
	/** Sidebar width (compact if terminal narrow) */
	sidebarWidth: number
	/** Main panel width (minus sidebar and borders) */
	mainWidth: number
	/** Whether terminal is below minimum usable size */
	isTooSmall: boolean
}

// Cache the last snapshot to avoid creating new objects on every call
let cachedSnapshot: TerminalSize | null = null
let cachedWidth = -1
let cachedHeight = -1

function createSnapshot(width: number, height: number): TerminalSize {
	const isTooSmall = width < TERMINAL.MIN_WIDTH || height < TERMINAL.MIN_HEIGHT
	const sidebarWidth =
		width < TERMINAL.MIN_WIDTH ? TERMINAL.SIDEBAR_WIDTH_COMPACT : TERMINAL.SIDEBAR_WIDTH

	return {
		width,
		height,
		contentHeight: Math.max(1, height - TERMINAL.FRAME_OVERHEAD),
		sidebarWidth,
		// mainWidth: total - sidebar - outer borders(2) - gap(1)
		mainWidth: Math.max(1, width - sidebarWidth - 3),
		isTooSmall,
	}
}

function getSnapshot(): TerminalSize {
	const width = stdout.columns ?? 80
	const height = stdout.rows ?? 24

	// Return cached snapshot if dimensions haven't changed
	if (cachedSnapshot && width === cachedWidth && height === cachedHeight) {
		return cachedSnapshot
	}

	// Update cache
	cachedWidth = width
	cachedHeight = height
	cachedSnapshot = createSnapshot(width, height)

	return cachedSnapshot
}

function subscribe(callback: () => void): () => void {
	stdout.on('resize', callback)
	return () => {
		stdout.off('resize', callback)
	}
}

/**
 * Hook that provides reactive terminal dimensions.
 * Updates automatically when terminal is resized.
 */
export function useTerminalSize(): TerminalSize {
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * Get current terminal size without subscribing to updates.
 * Useful for initial render or non-component code.
 */
export function getTerminalSize(): TerminalSize {
	return getSnapshot()
}
