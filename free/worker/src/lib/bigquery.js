/**
 * BigQuery integration using REST API
 *
 * Note: Uses JWT authentication with service account
 * Credentials are stored in environment variable BIGQUERY_CREDENTIALS
 */

import { logError, isRetryableError } from '../utils/error.js';

/**
 * Query BigQuery and return results
 *
 * @param {Object} env - Environment bindings (contains BIGQUERY_CREDENTIALS, project ID, etc.)
 * @returns {Promise<Array>} Array of rows
 */
export async function querySignals(env) {
  const projectId = env.BIGQUERY_PROJECT_ID || 'sunny-advantage-471523-b3';
  const dataset = env.BIGQUERY_DATASET || 'analytics';
  const view = env.BIGQUERY_VIEW || 'v_api_free_signals';

  const query = `
    SELECT *
    FROM \`${projectId}.${dataset}.${view}\`
    ORDER BY signal_strength DESC, ticker ASC
    LIMIT 100
  `;

  console.log('[BigQuery] Executing query:', { projectId, dataset, view });

  try {
    // Get access token using service account JWT
    const accessToken = await getAccessToken(env);

    // Execute query via BigQuery REST API
    const response = await fetch(
      `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          useLegacySql: false,
          timeoutMs: 30000,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BigQuery API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    if (!result.jobComplete) {
      throw new Error('BigQuery job did not complete within timeout');
    }

    // Transform BigQuery response to array of objects
    const rows = transformBigQueryResults(result);

    console.log('[BigQuery] Query successful:', { rowCount: rows.length });

    return rows;
  } catch (error) {
    logError(error, { context: 'querySignals', projectId, dataset, view });

    // Check if error is retryable
    if (isRetryableError(error)) {
      console.warn('[BigQuery] Retryable error detected, consider implementing retry logic');
    }

    throw error;
  }
}

/**
 * Get OAuth2 access token using service account JWT
 *
 * @param {Object} env - Environment bindings
 * @returns {Promise<string>} Access token
 */
async function getAccessToken(env) {
  const credentials = JSON.parse(env.BIGQUERY_CREDENTIALS);

  // Create JWT assertion
  const jwtHeader = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtClaimSet = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/bigquery.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Note: In a real Worker, you'd need to implement JWT signing with RS256
  // For now, this is a placeholder. Consider using a library like jose or implementing WebCrypto signing
  // See: https://developers.cloudflare.com/workers/examples/signing-requests/

  // TODO: Implement proper JWT signing with credentials.private_key
  // For MVP, you might want to use a pre-generated token or implement signing using WebCrypto API

  throw new Error('JWT signing not yet implemented - requires WebCrypto RS256 signing');

  // Placeholder for token exchange (after JWT is signed)
  /*
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt,
    }),
  });

  const tokenData = await response.json();
  return tokenData.access_token;
  */
}

/**
 * Transform BigQuery REST API results to array of objects
 *
 * @param {Object} result - BigQuery query result
 * @returns {Array} Array of row objects
 */
function transformBigQueryResults(result) {
  if (!result.schema || !result.rows) {
    return [];
  }

  const fields = result.schema.fields.map(f => f.name);

  return result.rows.map(row => {
    const obj = {};
    row.f.forEach((cell, index) => {
      obj[fields[index]] = cell.v;
    });
    return obj;
  });
}
