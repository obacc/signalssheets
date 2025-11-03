/**
 * Error handling utilities
 */

/**
 * Log error with context
 */
export function logError(error, context = {}) {
  console.error('[ERROR]', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error) {
  if (error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

/**
 * Determine if error is retryable (for BigQuery queries)
 */
export function isRetryableError(error) {
  const retryableErrors = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    'Rate limit exceeded',
  ];

  const message = getErrorMessage(error);
  return retryableErrors.some(err => message.includes(err));
}
