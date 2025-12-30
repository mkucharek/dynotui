import { describe, expect, it } from 'vitest'
import { getErrorDisplayMessage, parseDynamoDBError } from './errors.js'

describe('parseDynamoDBError', () => {
	it('parses ValidationException', () => {
		const error = {
			name: 'ValidationException',
			message: 'Invalid FilterExpression: Attribute name is a reserved keyword',
		}
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('validation')
		expect(result.message).toBe('Invalid expression syntax')
		expect(result.details).toContain('reserved keyword')
	})

	it('parses ProvisionedThroughputExceededException', () => {
		const error = {
			name: 'ProvisionedThroughputExceededException',
			message: 'Exceeded provisioned throughput',
		}
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('throttled')
		expect(result.message).toBe('Request throttled. Try again.')
	})

	it('parses ThrottlingException', () => {
		const error = {
			name: 'ThrottlingException',
			message: 'Rate exceeded',
		}
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('throttled')
	})

	it('parses RequestLimitExceeded', () => {
		const error = {
			name: 'RequestLimitExceeded',
			message: 'Too many requests',
		}
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('throttled')
	})

	it('parses ResourceNotFoundException', () => {
		const error = {
			name: 'ResourceNotFoundException',
			message: 'Requested resource not found: Table: unknown-table',
		}
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('not_found')
		expect(result.message).toBe('Table or index not found')
	})

	it('parses AccessDeniedException', () => {
		const error = {
			name: 'AccessDeniedException',
			message: 'User is not authorized',
		}
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('access_denied')
		expect(result.message).toBe('Permission denied')
	})

	it('parses ConditionalCheckFailedException', () => {
		const error = {
			name: 'ConditionalCheckFailedException',
			message: 'The conditional request failed',
		}
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('conditional_check_failed')
	})

	it('handles unknown AWS errors', () => {
		const error = {
			name: 'UnknownAWSError',
			message: 'Something went wrong',
		}
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('unknown')
		expect(result.message).toBe('Something went wrong')
		expect(result.details).toBe('Error type: UnknownAWSError')
	})

	it('handles standard Error objects', () => {
		const error = new Error('Network failure')
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('unknown')
		expect(result.message).toBe('Network failure')
	})

	it('handles non-error values', () => {
		expect(parseDynamoDBError(null).type).toBe('unknown')
		expect(parseDynamoDBError(undefined).type).toBe('unknown')
		expect(parseDynamoDBError('string error').type).toBe('unknown')
	})

	// Credential errors
	it('parses ExpiredTokenException', () => {
		const error = { name: 'ExpiredTokenException', message: 'The security token has expired' }
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('credentials')
		expect(result.message).toContain('expired')
	})

	it('parses ExpiredToken', () => {
		const error = { name: 'ExpiredToken', message: 'Token expired' }
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('credentials')
	})

	it('parses CredentialsProviderError', () => {
		const error = {
			name: 'CredentialsProviderError',
			message: 'Could not load credentials from any provider',
		}
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('credentials')
		expect(result.message).toContain('credentials')
	})

	it('parses InvalidClientTokenId', () => {
		const error = { name: 'InvalidClientTokenId', message: 'The security token is invalid' }
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('credentials')
		expect(result.message).toContain('Invalid')
	})

	it('parses UnrecognizedClientException', () => {
		const error = { name: 'UnrecognizedClientException', message: 'Unrecognized client' }
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('credentials')
	})

	it('parses SignatureDoesNotMatch', () => {
		const error = { name: 'SignatureDoesNotMatch', message: 'Signature mismatch' }
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('credentials')
		expect(result.message).toContain('signature')
	})

	// Network errors
	it('parses TimeoutError', () => {
		const error = { name: 'TimeoutError', message: 'Connection timed out' }
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('network')
		expect(result.message).toContain('Network')
	})

	it('parses ENOTFOUND', () => {
		const error = { name: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND' }
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('network')
	})

	it('parses InvalidRegion', () => {
		const error = { name: 'InvalidRegion', message: 'Invalid region specified' }
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('network')
		expect(result.message).toContain('region')
	})

	// Fallback detection via message content
	it('detects expired token in unknown error message', () => {
		const error = { name: 'SomeError', message: 'The token has expired and needs refresh' }
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('credentials')
	})

	it('detects credential keyword in unknown error message', () => {
		const error = { name: 'SomeError', message: 'Unable to load credential from profile' }
		const result = parseDynamoDBError(error)
		expect(result.type).toBe('credentials')
	})
})

describe('getErrorDisplayMessage', () => {
	it('includes details for validation errors', () => {
		const error = {
			type: 'validation' as const,
			message: 'Invalid expression syntax',
			details: 'Attribute name is a reserved keyword',
		}
		const result = getErrorDisplayMessage(error)
		expect(result).toBe('Invalid expression syntax: Attribute name is a reserved keyword')
	})

	it('returns message only for non-validation errors', () => {
		const error = {
			type: 'throttled' as const,
			message: 'Request throttled. Try again.',
			details: 'Rate limit exceeded',
		}
		const result = getErrorDisplayMessage(error)
		expect(result).toBe('Request throttled. Try again.')
	})

	it('returns message when no details', () => {
		const error = {
			type: 'not_found' as const,
			message: 'Table or index not found',
		}
		const result = getErrorDisplayMessage(error)
		expect(result).toBe('Table or index not found')
	})

	it('includes details for credentials errors', () => {
		const error = {
			type: 'credentials' as const,
			message: 'AWS token expired. Re-authenticate with your profile.',
			details: 'The security token has expired',
		}
		const result = getErrorDisplayMessage(error)
		expect(result).toContain('AWS token expired')
		expect(result).toContain('The security token has expired')
	})

	it('returns message only for network errors (no details)', () => {
		const error = {
			type: 'network' as const,
			message: 'Network error. Check your connection.',
			details: 'Connection refused',
		}
		const result = getErrorDisplayMessage(error)
		expect(result).toBe('Network error. Check your connection.')
	})
})
