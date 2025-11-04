/**
 * Scheduled event handler (Cron Trigger)
 * Refreshes cache from BigQuery every 10 minutes
 */

import { querySignals } from './lib/bigquery.js';
import { transformBigQueryResponse } from './lib/transform.js';
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

    // Query BigQuery
    console.log('[SCHEDULED] Querying BigQuery...');
    const rows = await querySignals(env);

    if (!rows || rows.length === 0) {
      throw new Error('BigQuery returned no data');
    }

    // Transform to API format
    const ttlSeconds = parseInt(env.TTL_SECONDS || '600');
    responseData = transformBigQueryResponse(rows, ttlSeconds);

    // Update metadata to indicate BigQuery source
    responseData.meta.source_view = 'v_api_free_signals';
    responseData.meta.source = 'bq';

    console.log('[SCHEDULED] BigQuery data transformed:', {
      rowCount: responseData.data.length,
      stats: responseData.stats,
    });

    // Write to KV cache
    const cacheKey = 'signals:latest';
    await env.CACHE.put(cacheKey, JSON.stringify(responseData));

    // Store cron health status
    const healthStatus = {
      last_run: new Date().toISOString(),
      status: 'success',
      rowcount: responseData.data.length,
      duration_ms: Date.now() - startTime,
    };
    await env.CACHE.put('cron:health', JSON.stringify(healthStatus), {
      expirationTtl: 1800, // 30 minutes
    });

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
      source: 'bq',
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logError(error, { context: 'handleScheduled', duration_ms: duration });

    console.error('[SCHEDULED] Cache refresh failed:', {
      duration_ms: duration,
      error: error.message,
    });

    // Store error status
    const healthStatus = {
      last_run: new Date().toISOString(),
      status: 'error',
      error: error.message,
      duration_ms: duration,
    };

    try {
      await env.CACHE.put('cron:health', JSON.stringify(healthStatus), {
        expirationTtl: 1800,
      });
    } catch (kvError) {
      console.error('[SCHEDULED] Failed to write health status:', kvError);
    }

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
