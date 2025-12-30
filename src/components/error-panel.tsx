import { Box, Text, useInput } from 'ink'
import type { DynamoDBErrorType, ParsedDynamoDBError } from '../services/dynamodb/errors.js'
import { borders, colors, symbols } from '../theme.js'

export type ErrorPanelProps = {
	error: ParsedDynamoDBError
	profile?: string
	onRetry?: () => void
	onBack?: () => void
}

type ErrorGuidance = {
	title: string
	explanation: string
	suggestions: string[]
}

function getErrorGuidance(error: ParsedDynamoDBError, profile?: string): ErrorGuidance {
	const profileArg = profile ? ` --profile ${profile}` : ''

	const guidance: Record<DynamoDBErrorType, ErrorGuidance> = {
		credentials: {
			title: 'Authentication Error',
			explanation: 'Your AWS credentials are invalid or expired.',
			suggestions: [
				`aws sso login${profileArg}`,
				`aws sts get-caller-identity${profileArg}`,
				'Check ~/.aws/credentials or ~/.aws/config',
			],
		},
		access_denied: {
			title: 'Access Denied',
			explanation: "Your credentials don't have permission for this operation.",
			suggestions: [
				'Check IAM policy for dynamodb:* permissions',
				'Verify you have access to this table/region',
				`aws iam get-user${profileArg}`,
			],
		},
		network: {
			title: 'Network Error',
			explanation: 'Unable to connect to AWS DynamoDB.',
			suggestions: [
				'Check your internet connection',
				'Verify the AWS region is correct',
				'Check firewall/proxy settings',
			],
		},
		throttled: {
			title: 'Request Throttled',
			explanation: 'Too many requests. DynamoDB rate limit exceeded.',
			suggestions: [
				'Wait a moment and retry',
				'Consider enabling auto-scaling',
				'Reduce scan/query frequency',
			],
		},
		not_found: {
			title: 'Resource Not Found',
			explanation: 'The table or index does not exist.',
			suggestions: [
				'Verify the table name is correct',
				'Check you are in the correct region',
				`aws dynamodb list-tables${profileArg}`,
			],
		},
		validation: {
			title: 'Validation Error',
			explanation: 'Invalid query syntax or parameters.',
			suggestions: [
				'Check filter expression syntax',
				'Verify attribute names and types',
				'Use # prefix for reserved keywords',
			],
		},
		conditional_check_failed: {
			title: 'Condition Failed',
			explanation: 'The conditional check in the operation failed.',
			suggestions: [
				'Item may not exist or has changed',
				'Check your condition expression',
				'Refresh and try again',
			],
		},
		unknown: {
			title: 'Error',
			explanation: error.message,
			suggestions: ['Check the error details below', 'Try refreshing the data'],
		},
	}

	return guidance[error.type]
}

export function ErrorPanel({ error, profile, onRetry, onBack }: ErrorPanelProps) {
	const guidance = getErrorGuidance(error, profile)

	useInput(
		(input, key) => {
			if (input === 'r' && onRetry) {
				onRetry()
			} else if (key.escape && onBack) {
				onBack()
			}
		},
		{ isActive: !!(onRetry || onBack) },
	)

	return (
		<Box
			flexDirection="column"
			borderStyle={borders.style}
			borderColor={colors.error}
			paddingX={2}
			paddingY={1}
		>
			{/* Header */}
			<Box gap={1}>
				<Text color={colors.error}>{symbols.errorIcon}</Text>
				<Text bold color={colors.error}>
					{guidance.title}
				</Text>
			</Box>

			{/* Explanation */}
			<Box marginTop={1}>
				<Text color={colors.textSecondary}>{guidance.explanation}</Text>
			</Box>

			{/* Suggestions */}
			<Box flexDirection="column" marginTop={1}>
				<Text color={colors.textMuted}>Try:</Text>
				{guidance.suggestions.map((suggestion) => (
					<Box key={suggestion} marginLeft={2}>
						<Text color={colors.textSecondary}>
							{suggestion.startsWith('aws ') || suggestion.startsWith('Check ') ? (
								<Text color={colors.dataValue}>{suggestion}</Text>
							) : (
								suggestion
							)}
						</Text>
					</Box>
				))}
			</Box>

			{/* Error details */}
			{error.details && error.type !== 'unknown' && (
				<Box marginTop={1} flexDirection="column">
					<Text color={colors.textMuted}>Details:</Text>
					<Box marginLeft={2}>
						<Text color={colors.textMuted}>{error.details}</Text>
					</Box>
				</Box>
			)}

			{/* Actions */}
			{(onRetry || onBack) && (
				<Box marginTop={1} gap={2}>
					{onRetry && (
						<Text>
							<Text color={colors.focus} bold>
								[r]
							</Text>
							<Text color={colors.textSecondary}> Retry</Text>
						</Text>
					)}
					{onBack && (
						<Text>
							<Text color={colors.focus} bold>
								[Esc]
							</Text>
							<Text color={colors.textSecondary}> Back</Text>
						</Text>
					)}
				</Box>
			)}
		</Box>
	)
}
