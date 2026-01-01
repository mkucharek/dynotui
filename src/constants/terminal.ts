/**
 * Terminal layout constants for responsive UI calculations.
 */
export const TERMINAL = {
	/** Minimum terminal width for usable UI */
	MIN_WIDTH: 80,
	/** Minimum terminal height for usable UI */
	MIN_HEIGHT: 20,

	/** Default sidebar width */
	SIDEBAR_WIDTH: 28,
	/** Compact sidebar width for narrow terminals */
	SIDEBAR_WIDTH_COMPACT: 24,

	/** Frame overhead: header(1) + 2 separators(2) + footer(1) + borders(2) */
	FRAME_OVERHEAD: 6,
	/** MainPanel overhead: border(2) + header(1) + sep(1) + metadata(1) + margin+sep(2) + footer(1) */
	MAIN_PANEL_OVERHEAD: 8,
	/** DataTable overhead: header(1) + sep(1) + scroll indicator(1) */
	DATA_TABLE_OVERHEAD: 3,
	/** SidebarSection overhead: title + separator + borders */
	SIDEBAR_SECTION_OVERHEAD: 4,

	/** Minimum column width in DataTable */
	MIN_COLUMN_WIDTH: 8,
	/** Column gap in DataTable */
	COLUMN_GAP: 1,
	/** Selection indicator width in DataTable */
	SELECTOR_WIDTH: 2,
} as const

export type TerminalConstants = typeof TERMINAL
