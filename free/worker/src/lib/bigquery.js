/**
 * BigQuery integration using REST API with JWT authentication
 * Uses WebCrypto API for RS256 JWT signing
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
      console.warn('[BigQuery] Retryable error detected');
    }

    throw error;
  }
}

/**
 * Get OAuth2 access token using service account JWT
 * Implements RS256 signing with WebCrypto API
 *
 * @param {Object} env - Environment bindings
 * @returns {Promise<string>} Access token
 */
async function getAccessToken(env) {
  const credentials = JSON.parse(env.BIGQUERY_CREDENTIALS);

  // JWT header
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  // JWT claim set
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/bigquery.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Create JWT assertion
  const headerB64 = base64urlEncode(JSON.stringify(header));
  const claimSetB64 = base64urlEncode(JSON.stringify(claimSet));
  const signatureInput = `${headerB64}.${claimSetB64}`;

  // Sign with private key using WebCrypto
  const signature = await signRS256(signatureInput, credentials.private_key);
  const signatureB64 = base64urlEncode(signature);

  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
  }

  const tokenData = await response.json();
  return tokenData.access_token;
}

/**
 * Sign data with RS256 using WebCrypto API
 *
 * @param {string} data - Data to sign
 * @param {string} privateKeyPEM - Private key in PEM format
 * @returns {Promise<ArrayBuffer>} Signature
 */
async function signRS256(data, privateKeyPEM) {
  // Remove PEM header/footer and decode base64
  const pemContents = privateKeyPEM
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryDer = base64Decode(pemContents);

  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign data
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    dataBuffer
  );

  return signature;
}

/**
 * Base64 decode (standard base64)
 */
function base64Decode(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Base64url encode (RFC 4648)
 */
function base64urlEncode(data) {
  let base64;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    // ArrayBuffer
    const bytes = new Uint8Array(data);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }

  // Convert to base64url
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
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
