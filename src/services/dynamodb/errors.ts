export type DynamoDBErrorType =
	| 'validation'
	| 'throttled'
	| 'not_found'
	| 'access_denied'
	| 'conditional_check_failed'
	| 'unknown'

export type ParsedDynamoDBError = {
	type: DynamoDBErrorType
	message: string
	details?: string
}

// AWS SDK error structure
type AWSError = {
	name?: string
	message?: string
	$metadata?: {
		httpStatusCode?: number
	}
}

function isAWSError(error: unknown): error is AWSError {
	return typeof error === 'object' && error !== null && 'name' in error
}

export function parseDynamoDBError(error: unknown): ParsedDynamoDBError {
	if (!isAWSError(error)) {
		return {
			type: 'unknown',
			message: error instanceof Error ? error.message : 'Unknown error occurred',
		}
	}

	const errorName = error.name ?? ''
	const errorMessage = error.message ?? ''

	switch (errorName) {
		case 'ValidationException':
			return {
				type: 'validation',
				message: 'Invalid expression syntax',
				details: extractValidationDetails(errorMessage),
			}

		case 'ProvisionedThroughputExceededException':
		case 'ThrottlingException':
		case 'RequestLimitExceeded':
			return {
				type: 'throttled',
				message: 'Request throttled. Try again.',
				details: errorMessage,
			}

		case 'ResourceNotFoundException':
			return {
				type: 'not_found',
				message: 'Table or index not found',
				details: errorMessage,
			}

		case 'AccessDeniedException':
		case 'UnauthorizedAccess':
			return {
				type: 'access_denied',
				message: 'Permission denied',
				details: errorMessage,
			}

		case 'ConditionalCheckFailedException':
			return {
				type: 'conditional_check_failed',
				message: 'Condition check failed',
				details: errorMessage,
			}

		default:
			return {
				type: 'unknown',
				message: errorMessage || 'Operation failed',
				details: errorName ? `Error type: ${errorName}` : undefined,
			}
	}
}

function extractValidationDetails(message: string): string {
	// Common patterns in DynamoDB validation errors
	const patterns = [
		/Invalid (KeyConditionExpression|FilterExpression|ProjectionExpression):/i,
		/Attribute name is a reserved keyword/i,
		/Value provided in ExpressionAttributeValues unused/i,
		/Invalid operator/i,
		/Syntax error/i,
	]

	for (const pattern of patterns) {
		if (pattern.test(message)) {
			return message
		}
	}

	// Return cleaned up message
	return message.replace(/^One or more parameter values were invalid:\s*/i, '')
}

export function getErrorDisplayMessage(error: ParsedDynamoDBError): string {
	if (error.details && error.type === 'validation') {
		return `${error.message}: ${error.details}`
	}
	return error.message
}
