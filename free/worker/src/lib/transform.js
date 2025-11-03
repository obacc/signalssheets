/**
 * Transform BigQuery data to API contract format
 */

/**
 * Transform BigQuery row (snake_case) to API format (camelCase)
 *
 * @param {Object} row - BigQuery row with snake_case fields
 * @returns {Object} Transformed signal object
 */
export function transformBigQueryRow(row) {
  return {
    id: row.id,
    ticker: row.ticker,
    companyName: row.company_name,
    sector: row.sector,
    signal: {
      type: row.signal_type,
      strength: row.signal_strength,
      dominantAuthor: row.dominant_author,
      confidence: row.confidence,
    },
    price: {
      current: row.price,
      changePercent: row.change_percent,
      target: row.target_price || null,
      stopLoss: row.stop_loss || null,
    },
    trinityScores: {
      lynch: row.trinity_score_lynch,
      oneil: row.trinity_score_oneil,
      graham: row.trinity_score_graham,
      average: row.trinity_score_avg,
    },
    riskProfile: row.risk_profile,
    fundamentals: {
      marketCap: row.market_cap,
      peRatio: row.pe_ratio || null,
      eps: row.eps || null,
      dividendYield: row.dividend_yield,
      volume: row.volume,
    },
    dates: {
      signalDate: row.signal_date,
      lastUpdated: row.last_updated,
    },
    reasoning: row.reasoning || '',
  };
}

/**
 * Transform array of BigQuery rows to full API response
 *
 * @param {Array} rows - Array of BigQuery rows
 * @param {number} ttlSeconds - TTL in seconds
 * @returns {Object} Full API response with meta, stats, data
 */
export function transformBigQueryResponse(rows, ttlSeconds = 600) {
  const signals = rows.map(transformBigQueryRow);

  // Calculate stats
  const stats = {
    buy_signals: signals.filter(s => s.signal.type === 'BUY').length,
    sell_signals: signals.filter(s => s.signal.type === 'SELL').length,
    hold_signals: signals.filter(s => s.signal.type === 'HOLD').length,
    avg_trinity_score: calculateAverage(signals.map(s => s.trinityScores.average)),
  };

  return {
    meta: {
      generated_at: new Date().toISOString(),
      total_count: signals.length,
      ttl_seconds: ttlSeconds,
      source_view: 'v_api_free_signals',
      api_version: '1.0.0',
      refresh_interval_minutes: 10,
    },
    stats,
    data: signals,
  };
}

/**
 * Calculate average of array of numbers
 */
function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return Math.round((sum / numbers.length) * 10) / 10; // Round to 1 decimal
}
