/**
 * Data formatting utilities (JSON to CSV conversion)
 */

/**
 * Convert signals array to CSV format
 *
 * @param {Array} signals - Array of signal objects
 * @returns {string} CSV string
 */
export function signalsToCSV(signals) {
  if (!signals || signals.length === 0) {
    return 'id,ticker,company_name,sector,signal_type,signal_strength,dominant_author,price,change_percent,target_price,stop_loss,risk_profile,trinity_score_lynch,trinity_score_oneil,trinity_score_graham,trinity_score_avg,confidence,signal_date,last_updated,market_cap,pe_ratio,eps,dividend_yield,volume,reasoning';
  }

  // CSV headers (snake_case for compatibility with Excel/data tools)
  const headers = [
    'id',
    'ticker',
    'company_name',
    'sector',
    'signal_type',
    'signal_strength',
    'dominant_author',
    'price',
    'change_percent',
    'target_price',
    'stop_loss',
    'risk_profile',
    'trinity_score_lynch',
    'trinity_score_oneil',
    'trinity_score_graham',
    'trinity_score_avg',
    'confidence',
    'signal_date',
    'last_updated',
    'market_cap',
    'pe_ratio',
    'eps',
    'dividend_yield',
    'volume',
    'reasoning',
  ];

  // Convert nested JSON to flat CSV rows
  const rows = signals.map(signal => {
    return [
      signal.id,
      signal.ticker,
      escapeCSV(signal.companyName),
      escapeCSV(signal.sector),
      signal.signal.type,
      signal.signal.strength,
      escapeCSV(signal.signal.dominantAuthor),
      signal.price.current,
      signal.price.changePercent,
      signal.price.target || '',
      signal.price.stopLoss || '',
      signal.riskProfile,
      signal.trinityScores.lynch,
      signal.trinityScores.oneil,
      signal.trinityScores.graham,
      signal.trinityScores.average,
      signal.signal.confidence,
      signal.dates.signalDate,
      signal.dates.lastUpdated,
      escapeCSV(signal.fundamentals.marketCap),
      signal.fundamentals.peRatio || '',
      signal.fundamentals.eps || '',
      signal.fundamentals.dividendYield,
      signal.fundamentals.volume,
      escapeCSV(signal.reasoning || ''),
    ];
  });

  // Combine headers and rows
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ];

  return csvLines.join('\n');
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';

  const str = String(value);

  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Get CSV filename with current date
 */
export function getCSVFilename() {
  const date = new Date().toISOString().split('T')[0];
  return `indicium-signals-${date}.csv`;
}
