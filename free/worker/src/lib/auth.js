/**
 * Token authentication
 */

/**
 * Validate API token against whitelist in KV
 *
 * @param {string} token - Token from query string
 * @param {Object} env - Environment bindings (contains API_TOKENS KV)
 * @returns {Promise<{valid: boolean, error?: string, data?: Object}>}
 */
export async function validateToken(token, env) {
  // Check if token exists
  if (!token) {
    return {
      valid: false,
      error: 'MISSING_TOKEN',
      message: 'Authentication token is required. Provide ?token=YOUR_TOKEN',
    };
  }

  // Retrieve token data from KV
  let tokenData;
  try {
    const tokenJson = await env.API_TOKENS.get(token, { type: 'json' });

    if (!tokenJson) {
      return {
        valid: false,
        error: 'INVALID_TOKEN',
        message: 'Authentication token is invalid or expired',
      };
    }

    tokenData = tokenJson;
  } catch (error) {
    console.error('[AUTH] Error fetching token from KV:', error);
    return {
      valid: false,
      error: 'AUTH_ERROR',
      message: 'Error validating authentication token',
    };
  }

  // Check if token is active
  if (!tokenData.is_active) {
    return {
      valid: false,
      error: 'TOKEN_INACTIVE',
      message: 'Authentication token has been deactivated',
    };
  }

  // Token is valid
  return {
    valid: true,
    data: tokenData,
  };
}

/**
 * Get token from request URL
 *
 * @param {Request} request
 * @returns {string|null}
 */
export function getTokenFromRequest(request) {
  const url = new URL(request.url);
  return url.searchParams.get('token');
}
