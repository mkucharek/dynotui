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
})
