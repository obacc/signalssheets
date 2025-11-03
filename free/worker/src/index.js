/**
 * Indicium Signals - Free API Worker
 * Main request handler
 */

import { getTokenFromRequest, validateToken } from './lib/auth.js';
import { checkRateLimit } from './lib/ratelimit.js';
import { signalsToCSV, getCSVFilename } from './lib/format.js';
import { jsonResponse, csvResponse, errorResponse, optionsResponse } from './utils/response.js';
import { logError } from './utils/error.js';
import { handleScheduled } from './scheduled.js';

/**
 * Main Worker entry point
 */
export default {
  /**
   * Handle HTTP requests
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return optionsResponse();
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return errorResponse('METHOD_NOT_ALLOWED', 'Only GET requests are allowed', 405);
    }

    // Route to endpoint
    if (url.pathname === '/v1/signals') {
      return handleSignalsRequest(request, env);
    }

    // Health check endpoint
    if (url.pathname === '/health' || url.pathname === '/') {
      return jsonResponse({
        status: 'ok',
        service: 'indicium-free-api',
        version: env.API_VERSION || '1.0.0',
        timestamp: new Date().toISOString(),
      });
    }

    // 404 for unknown paths
    return errorResponse('NOT_FOUND', 'Endpoint not found. Try GET /v1/signals', 404);
  },

  /**
   * Handle scheduled events (Cron Trigger)
   */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(event, env, ctx));
  },
};

/**
 * Handle GET /v1/signals
 */
async function handleSignalsRequest(request, env) {
  const url = new URL(request.url);
  const startTime = Date.now();

  try {
    // 1. Get and validate token
    const token = getTokenFromRequest(request);
    const authResult = await validateToken(token, env);

    if (!authResult.valid) {
      console.warn('[AUTH] Invalid token attempt:', { token: token?.substring(0, 8) + '***' });
      return errorResponse(authResult.error, authResult.message, 401);
    }

    // 2. Check rate limit
    const rateLimitResult = await checkRateLimit(token, env);

    if (!rateLimitResult.allowed) {
      console.warn('[RATE_LIMIT] Limit exceeded:', { token: token.substring(0, 8) + '***' });
      return errorResponse(
        rateLimitResult.error,
        rateLimitResult.message,
        429,
        { retry_after: rateLimitResult.retryAfter }
      );
    }

    // 3. Get format parameter
    const format = url.searchParams.get('format') || 'json';

    if (!['json', 'csv'].includes(format)) {
      return errorResponse('INVALID_FORMAT', "Format must be 'json' or 'csv'", 400);
    }

    // 4. Read cached data from KV
    const cacheKey = 'signals:latest';
    const cachedData = await env.CACHE.get(cacheKey, { type: 'json' });

    if (!cachedData) {
      console.error('[CACHE] No data in cache');
      return errorResponse(
        'CACHE_EMPTY',
        'Cache not yet populated. Please retry in 30 seconds.',
        503,
        { retry_after: 30 }
      );
    }

    // 5. Prepare response headers
    const responseHeaders = {
      'X-Data-Generated-At': cachedData.meta.generated_at,
      'X-Cache-Hit': 'true',
      'X-API-Version': env.API_VERSION || '1.0.0',
      'Cache-Control': `public, max-age=${env.TTL_SECONDS || 600}`,
    };

    // 6. Return response in requested format
    if (format === 'csv') {
      const csv = signalsToCSV(cachedData.data);
      const filename = getCSVFilename();

      const duration = Date.now() - startTime;
      console.log('[REQUEST] CSV served:', {
        token: token.substring(0, 8) + '***',
        rows: cachedData.data.length,
        duration_ms: duration,
      });

      return csvResponse(csv, filename, responseHeaders);
    } else {
      // JSON
      const duration = Date.now() - startTime;
      console.log('[REQUEST] JSON served:', {
        token: token.substring(0, 8) + '***',
        rows: cachedData.data.length,
        duration_ms: duration,
      });

      return jsonResponse(cachedData, 200, responseHeaders);
    }
  } catch (error) {
    logError(error, { context: 'handleSignalsRequest', url: request.url });
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred. Please try again later.', 500);
  }
}
