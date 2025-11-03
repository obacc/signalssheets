/**
 * Response utilities for consistent API responses
 */

/**
 * CORS headers for JSON responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

/**
 * Create a JSON response
 */
export function jsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...additionalHeaders,
    },
  });
}

/**
 * Create a CSV response
 */
export function csvResponse(csv, filename, additionalHeaders = {}) {
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      ...additionalHeaders,
    },
  });
}

/**
 * Create an error response
 */
export function errorResponse(code, message, status = 400, additionalData = {}) {
  return jsonResponse(
    {
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        ...additionalData,
      },
    },
    status
  );
}

/**
 * Handle OPTIONS preflight request
 */
export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
