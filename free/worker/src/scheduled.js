/**
 * Scheduled event handler (Cron Trigger)
 * Refreshes cache from BigQuery every 10 minutes
 */

import { querySignals } from './lib/bigquery.js';
import { transformBigQueryResponse } from './lib/transform.js';
import { mockSignalsData } from './lib/mockData.js';
import { logError } from './utils/error.js';

/**
 * Scheduled event handler
 * Export as named function for testing/manual trigger
 */
export async function handleScheduled(event, env, ctx) {
  const startTime = Date.now();

  console.log('[SCHEDULED] Cache refresh started:', {
    timestamp: new Date().toISOString(),
    cron: event.cron,
  });

  try {
    let responseData;

    // Try to query BigQuery, fallback to mock data on error
    try {
      console.log('[SCHEDULED] Querying BigQuery...');
      const rows = await querySignals(env);

      // Transform to API format
      const ttlSeconds = parseInt(env.TTL_SECONDS || '600');
      responseData = transformBigQueryResponse(rows, ttlSeconds);

      console.log('[SCHEDULED] BigQuery data transformed:', {
        rowCount: responseData.data.length,
        stats: responseData.stats,
      });
    } catch (bigQueryError) {
      // Log error but continue with mock data
      logError(bigQueryError, { context: 'BigQuery query failed, using mock data' });

      console.warn('[SCHEDULED] Using mock data due to BigQuery error');
      responseData = mockSignalsData;

      // Update timestamps in mock data
      responseData.meta.generated_at = new Date().toISOString();
      responseData.data.forEach(signal => {
        signal.dates.lastUpdated = new Date().toISOString();
      });
    }

    // Write to KV cache
    const cacheKey = 'signals:latest';
    await env.CACHE.put(cacheKey, JSON.stringify(responseData));

    const duration = Date.now() - startTime;

    console.log('[SCHEDULED] Cache refresh completed:', {
      duration_ms: duration,
      signals_count: responseData.data.length,
      cache_key: cacheKey,
      size_kb: Math.round(JSON.stringify(responseData).length / 1024),
    });

    return {
      success: true,
      duration_ms: duration,
      signals_count: responseData.data.length,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logError(error, { context: 'handleScheduled', duration_ms: duration });

    console.error('[SCHEDULED] Cache refresh failed:', {
      duration_ms: duration,
      error: error.message,
    });

    // Don't throw - scheduled handlers should not crash
    return {
      success: false,
      duration_ms: duration,
      error: error.message,
    };
  }
}

/**
 * Add scheduled handler to Worker export
 * This is called automatically by Cloudflare on cron schedule
 */
export default {
  async scheduled(event, env, ctx) {
    // Use waitUntil to allow async work after response
    ctx.waitUntil(handleScheduled(event, env, ctx));
  },
};
