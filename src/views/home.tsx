import { Box, useInput } from 'ink'
import { useEffect, useState } from 'react'
import { Footer, Header, Loading, Panel, TableList } from '../components/index.js'
import { useAppStore } from '../store/app-store.js'
import { useTables } from '../store/use-tables.js'

export function HomeView() {
	const { navigate } = useAppStore()
	const { tables, isLoading, error, hasMore, fetchTables, fetchNextPage } = useTables()
	const [selectedIndex, setSelectedIndex] = useState(0)

	useEffect(() => {
		fetchTables()
	}, [fetchTables])

	useInput((input, key) => {
		if (input === 'n' && hasMore && !isLoading) {
			fetchNextPage()
		} else if (input === 'r') {
			fetchTables()
		} else if (key.return && tables[selectedIndex]) {
			navigate({ view: 'table', tableName: tables[selectedIndex], mode: 'scan' })
		}
	})

	const handleTableSelect = (tableName: string) => {
		navigate({ view: 'table', tableName, mode: 'scan' })
	}

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Header />

			<Box flexGrow={1} padding={1}>
				<Panel title="Tables" focused flexGrow={1}>
					{isLoading && tables.length === 0 ? (
						<Loading message="Loading tables..." />
					) : error ? (
						<Box>
							<Box flexDirection="column">{error}</Box>
						</Box>
					) : (
						<TableList
							tables={tables}
							selectedIndex={selectedIndex}
							onSelect={setSelectedIndex}
							onEnter={handleTableSelect}
						/>
					)}

					{hasMore && !isLoading && tables.length > 0 && (
						<Box marginTop={1}>
							<Loading message="Press 'n' to load more..." />
						</Box>
					)}
				</Panel>
			</Box>

			<Footer
				bindings={[
					{ key: 'Enter', label: 'Open' },
					{ key: 'n', label: 'Load More' },
					{ key: 'r', label: 'Refresh' },
					{ key: 'q', label: 'Quit' },
				]}
			/>
		</Box>
	)
}
