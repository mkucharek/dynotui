export type View = 'home' | 'table' | 'item' | 'settings'

export type HomeViewState = {
	view: 'home'
}

export type TableViewState = {
	view: 'table'
	tableName: string
	mode: 'scan' | 'query'
}

export type ItemViewState = {
	view: 'item'
	tableName: string
	item: Record<string, unknown>
}

export type SettingsViewState = {
	view: 'settings'
}

export type ViewState = HomeViewState | TableViewState | ItemViewState | SettingsViewState

export type NavigationHistory = ViewState[]
