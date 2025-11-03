/**
 * Rate limiting using KV with TTL
 */

/**
 * Check and increment rate limit for a token
 *
 * @param {string} token - API token
 * @param {Object} env - Environment bindings (contains RATE_LIMIT KV and vars)
 * @returns {Promise<{allowed: boolean, error?: string, retryAfter?: number}>}
 */
export async function checkRateLimit(token, env) {
  const limitPerMin = parseInt(env.RATE_LIMIT_PER_MIN || '30');

  // Create time window key (1 minute precision)
  const now = Date.now();
  const windowMinute = Math.floor(now / 60000); // Current minute
  const key = `ratelimit:${token}:${windowMinute}`;

  try {
    // Get current count
    const countStr = await env.RATE_LIMIT.get(key);
    const count = countStr ? parseInt(countStr) : 0;

    // Check if limit exceeded
    if (count >= limitPerMin) {
      const secondsIntoMinute = Math.floor((now % 60000) / 1000);
      const retryAfter = 60 - secondsIntoMinute;

      return {
        allowed: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit of ${limitPerMin} requests per minute exceeded`,
        retryAfter,
      };
    }

    // Increment counter with 60 second TTL
    await env.RATE_LIMIT.put(key, String(count + 1), {
      expirationTtl: 60,
    });

    return {
      allowed: true,
      remaining: limitPerMin - count - 1,
    };
  } catch (error) {
    console.error('[RATE_LIMIT] Error checking rate limit:', error);
    // Fail open (allow request) on error
    return {
      allowed: true,
      remaining: limitPerMin,
    };
  }
}

/**
 * Optional: Daily rate limit check (for future use)
 */
export async function checkDailyRateLimit(token, env) {
  const limitPerDay = parseInt(env.RATE_LIMIT_PER_DAY || '1000');

  // Create daily window key
  const now = Date.now();
  const windowDay = Math.floor(now / 86400000); // Current day
  const key = `ratelimit-daily:${token}:${windowDay}`;

  try {
    const countStr = await env.RATE_LIMIT.get(key);
    const count = countStr ? parseInt(countStr) : 0;

    if (count >= limitPerDay) {
      return {
        allowed: false,
        error: 'DAILY_LIMIT_EXCEEDED',
        message: `Daily limit of ${limitPerDay} requests exceeded`,
      };
    }

    // Increment counter with 24 hour TTL
    await env.RATE_LIMIT.put(key, String(count + 1), {
      expirationTtl: 86400,
    });

    return {
      allowed: true,
      remaining: limitPerDay - count - 1,
    };
  } catch (error) {
    console.error('[RATE_LIMIT] Error checking daily rate limit:', error);
    return { allowed: true };
  }
}
