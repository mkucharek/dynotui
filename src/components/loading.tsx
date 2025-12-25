import { Text } from 'ink'
import Spinner from 'ink-spinner'

export type LoadingProps = {
	message?: string
}

export function Loading({ message = 'Loading...' }: LoadingProps) {
	return (
		<Text>
			<Text color="cyan">
				<Spinner type="dots" />
			</Text>{' '}
			{message}
		</Text>
	)
}
