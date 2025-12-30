export type DynamoDBErrorType =
	| 'validation'
	| 'throttled'
	| 'not_found'
	| 'access_denied'
	| 'conditional_check_failed'
	| 'credentials'
	| 'network'
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

		// Credential/authentication errors
		case 'ExpiredToken':
		case 'ExpiredTokenException':
			return {
				type: 'credentials',
				message: 'AWS token expired. Re-authenticate with your profile.',
				details: errorMessage,
			}

		case 'CredentialsProviderError':
		case 'CredentialProviderError':
			return {
				type: 'credentials',
				message: 'No AWS credentials found. Check your profile config.',
				details: errorMessage,
			}

		case 'InvalidClientTokenId':
		case 'UnrecognizedClientException':
			return {
				type: 'credentials',
				message: 'Invalid AWS credentials. Check your access keys.',
				details: errorMessage,
			}

		case 'InvalidSignatureException':
		case 'SignatureDoesNotMatch':
			return {
				type: 'credentials',
				message: 'AWS signature mismatch. Check credentials or clock sync.',
				details: errorMessage,
			}

		// Network errors
		case 'TimeoutError':
		case 'NetworkingError':
		case 'ENOTFOUND':
		case 'ECONNREFUSED':
		case 'ETIMEDOUT':
			return {
				type: 'network',
				message: 'Network error. Check your connection.',
				details: errorMessage,
			}

		case 'InvalidRegion':
		case 'UnknownEndpoint':
			return {
				type: 'network',
				message: 'Invalid AWS region or endpoint.',
				details: errorMessage,
			}

		default:
			// Check for credential-related keywords in unknown errors
			if (
				errorMessage.toLowerCase().includes('expired') &&
				errorMessage.toLowerCase().includes('token')
			) {
				return {
					type: 'credentials',
					message: 'AWS token expired. Re-authenticate with your profile.',
					details: errorMessage,
				}
			}
			if (
				errorMessage.toLowerCase().includes('credential') ||
				errorMessage.toLowerCase().includes('unable to sign')
			) {
				return {
					type: 'credentials',
					message: 'AWS credential error. Check your profile config.',
					details: errorMessage,
				}
			}
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
	// Include details for validation, credentials, and network errors
	if (error.details && (error.type === 'validation' || error.type === 'credentials')) {
		return `${error.message}: ${error.details}`
	}
	return error.message
}
