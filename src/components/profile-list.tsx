import { Box, Text, useInput } from 'ink'
import { useState } from 'react'
import type { AwsProfile } from '../services/aws-config.js'

export type ProfileListProps = {
	profiles: AwsProfile[]
	currentProfile?: string
	selectedIndex?: number
	onSelect?: (index: number) => void
	onEnter?: (profile: AwsProfile) => void
	focused?: boolean
	maxHeight?: number
}

export function ProfileList({
	profiles,
	currentProfile,
	selectedIndex: controlledIndex,
	onSelect,
	onEnter,
	focused = true,
	maxHeight = 15,
}: ProfileListProps) {
	// Initialize internal index from currentProfile (for uncontrolled mode)
	const [internalIndex, setInternalIndex] = useState(() => {
		const idx = profiles.findIndex((p) => p.name === (currentProfile ?? 'default'))
		return idx >= 0 ? idx : 0
	})
	const selectedIndex = controlledIndex ?? internalIndex

	const handleSelect = (index: number) => {
		if (onSelect) {
			onSelect(index)
		} else {
			setInternalIndex(index)
		}
	}

	useInput(
		(input, key) => {
			if (!focused || profiles.length === 0) return

			if (input === 'j' || key.downArrow) {
				handleSelect(Math.min(selectedIndex + 1, profiles.length - 1))
			} else if (input === 'k' || key.upArrow) {
				handleSelect(Math.max(selectedIndex - 1, 0))
			} else if (key.return && onEnter && profiles[selectedIndex]) {
				onEnter(profiles[selectedIndex])
			}
		},
		{ isActive: focused },
	)

	if (profiles.length === 0) {
		return (
			<Box padding={1}>
				<Text dimColor>No profiles found</Text>
			</Box>
		)
	}

	const visibleStart = Math.max(0, selectedIndex - Math.floor(maxHeight / 2))
	const visibleEnd = Math.min(profiles.length, visibleStart + maxHeight)
	const visibleProfiles = profiles.slice(visibleStart, visibleEnd)

	return (
		<Box flexDirection="column">
			{visibleProfiles.map((profile, i) => {
				const actualIndex = visibleStart + i
				const isSelected = actualIndex === selectedIndex
				const isCurrent = profile.name === (currentProfile ?? 'default')

				return (
					<Box key={profile.name}>
						<Text
							backgroundColor={isSelected ? 'cyan' : undefined}
							color={isSelected ? 'black' : undefined}
						>
							{isSelected ? '> ' : '  '}
							{profile.name}
							{isCurrent && !isSelected && <Text color="green"> (active)</Text>}
							{isCurrent && isSelected && <Text color="black"> (active)</Text>}
						</Text>
						{profile.region && (
							<Text dimColor={!isSelected} color={isSelected ? 'black' : undefined}>
								{' '}
								- {profile.region}
							</Text>
						)}
					</Box>
				)
			})}

			{profiles.length > maxHeight && (
				<Box marginTop={1}>
					<Text dimColor>
						{visibleStart + 1}-{visibleEnd} of {profiles.length}
					</Text>
				</Box>
			)}
		</Box>
	)
}
