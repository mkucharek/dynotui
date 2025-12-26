import { useCallback } from 'react'
import type { ItemViewState, TableViewState } from '../types/navigation.js'
import { useAppStore } from './app-store.js'

export function useNavigation() {
	const { currentView, navigate, goBack, canGoBack } = useAppStore()

	const navigateToHome = useCallback(() => {
		navigate({ view: 'home' })
	}, [navigate])

	const navigateToSettings = useCallback(() => {
		navigate({ view: 'settings' })
	}, [navigate])

	const navigateToTable = useCallback(
		(tableName: string, mode: 'scan' | 'query' = 'scan') => {
			navigate({ view: 'table', tableName, mode } satisfies TableViewState)
		},
		[navigate],
	)

	const navigateToItem = useCallback(
		(tableName: string, item: Record<string, unknown>) => {
			navigate({ view: 'item', tableName, item } satisfies ItemViewState)
		},
		[navigate],
	)

	const switchMode = useCallback(
		(mode: 'scan' | 'query') => {
			if (currentView.view === 'table') {
				navigate({ ...currentView, mode })
			}
		},
		[currentView, navigate],
	)

	return {
		currentView,
		canGoBack: canGoBack(),
		goBack,
		navigateToHome,
		navigateToSettings,
		navigateToTable,
		navigateToItem,
		switchMode,
	}
}
