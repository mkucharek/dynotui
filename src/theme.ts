/**
 * AWS-inspired theme configuration for DynoTUI
 * Colors adapted from AWS Console palette for terminal readability
 */

export const colors = {
	// Brand colors
	brand: '#FF9900', // AWS Orange - brand, primary accent
	focus: '#0073BB', // AWS Blue - focused elements, links
	active: '#1B8A51', // AWS Green - success, active indicators
	error: '#D13212', // AWS Red - errors, warnings

	// Surface colors
	surface: '#232F3E', // AWS Squid Ink - backgrounds, headers
	border: '#3D4F5F', // Muted blue-gray - unfocused borders
	borderFocused: '#0073BB', // AWS Blue for focused borders

	// Text colors
	text: '#FFFFFF',
	textSecondary: '#879596', // AWS Gray - secondary text, dims
	textMuted: '#5F6B7A',

	// Data colors
	dataValue: '#FFD966', // Soft gold for data values
	dataKey: '#FF9900', // Orange for keys (PK/SK)
	dataNull: '#5F6B7A', // Muted for null values
} as const

export const borders = {
	style: 'round' as const, // ╭─╮│╰╯
	focusedColor: colors.borderFocused,
	unfocusedColor: colors.border,
} as const

export const spacing = {
	panelPadding: 1,
	sectionGap: 1,
} as const

export const symbols = {
	// Brand
	brandMark: '◆',

	// Connection status
	connected: '●',
	disconnected: '○',

	// Navigation
	breadcrumbSeparator: '›',
	tabSeparator: '│',

	// Selection & indicators
	selected: '▸',
	active: '●',
	inactive: '○',
	collapsed: '▸',
	expanded: '▾',

	// Scroll indicators
	scrollUp: '▲',
	scrollDown: '▼',
	hasMore: '▼',

	// Data formatting
	null: '∅',
	binary: '<binary>',

	// Loading spinners
	spinnerFrames: ['◐', '◓', '◑', '◒'] as const,
	pulsingDots: ['●○○', '○●○', '○○●', '○●○'] as const,

	// Separators
	sectionSeparator: '┄',
	headerSeparator: '─',

	// Error
	errorIcon: '✖',
} as const

export const theme = {
	colors,
	borders,
	spacing,
	symbols,
} as const

export type Theme = typeof theme
