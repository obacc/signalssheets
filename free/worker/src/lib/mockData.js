/**
 * Mock data for initial testing (before BigQuery integration)
 */

export const mockSignalsData = {
  meta: {
    generated_at: new Date().toISOString(),
    total_count: 5,
    ttl_seconds: 600,
    source_view: 'mock_data',
    api_version: '1.0.0',
    refresh_interval_minutes: 10,
  },
  stats: {
    buy_signals: 2,
    sell_signals: 1,
    hold_signals: 2,
    avg_trinity_score: 72.4,
  },
  data: [
    {
      id: 'sig-001',
      ticker: 'NVDA',
      companyName: 'NVIDIA Corporation',
      sector: 'Technology',
      signal: {
        type: 'BUY',
        strength: 95,
        dominantAuthor: "O'Neil",
        confidence: 92,
      },
      price: {
        current: 495.50,
        changePercent: 3.2,
        target: 575.00,
        stopLoss: 445.00,
      },
      trinityScores: {
        lynch: 88,
        oneil: 95,
        graham: 72,
        average: 85.0,
      },
      riskProfile: 'Aggressive',
      fundamentals: {
        marketCap: '$2.5T',
        peRatio: 78.5,
        eps: 6.32,
        dividendYield: 0.05,
        volume: 45230000,
      },
      dates: {
        signalDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString(),
      },
      reasoning: 'Strong momentum breakout above 52-week high. Institutional accumulation increasing. AI growth story intact.',
    },
    {
      id: 'sig-002',
      ticker: 'AAPL',
      companyName: 'Apple Inc.',
      sector: 'Technology',
      signal: {
        type: 'HOLD',
        strength: 72,
        dominantAuthor: 'Graham',
        confidence: 78,
      },
      price: {
        current: 178.25,
        changePercent: -0.5,
        target: 195.00,
        stopLoss: 165.00,
      },
      trinityScores: {
        lynch: 75,
        oneil: 68,
        graham: 85,
        average: 76.0,
      },
      riskProfile: 'Moderate',
      fundamentals: {
        marketCap: '$2.8T',
        peRatio: 29.5,
        eps: 6.05,
        dividendYield: 0.52,
        volume: 52340000,
      },
      dates: {
        signalDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        lastUpdated: new Date().toISOString(),
      },
      reasoning: 'Solid fundamentals with stable earnings. Premium valuation limits upside. Wait for better entry point.',
    },
    {
      id: 'sig-003',
      ticker: 'TSLA',
      companyName: 'Tesla Inc.',
      sector: 'Consumer Cyclical',
      signal: {
        type: 'SELL',
        strength: 82,
        dominantAuthor: 'Graham',
        confidence: 75,
      },
      price: {
        current: 242.80,
        changePercent: -2.1,
        target: 195.00,
        stopLoss: 260.00,
      },
      trinityScores: {
        lynch: 42,
        oneil: 55,
        graham: 28,
        average: 41.7,
      },
      riskProfile: 'Aggressive',
      fundamentals: {
        marketCap: '$771B',
        peRatio: 75.2,
        eps: 3.23,
        dividendYield: 0.0,
        volume: 98560000,
      },
      dates: {
        signalDate: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
        lastUpdated: new Date().toISOString(),
      },
      reasoning: 'Valuation stretched relative to earnings growth. Technical breakdown below key support. Rising inventory levels.',
    },
    {
      id: 'sig-004',
      ticker: 'MSFT',
      companyName: 'Microsoft Corporation',
      sector: 'Technology',
      signal: {
        type: 'BUY',
        strength: 88,
        dominantAuthor: 'Lynch',
        confidence: 85,
      },
      price: {
        current: 415.30,
        changePercent: 1.8,
        target: 475.00,
        stopLoss: 385.00,
      },
      trinityScores: {
        lynch: 92,
        oneil: 82,
        graham: 78,
        average: 84.0,
      },
      riskProfile: 'Moderate',
      fundamentals: {
        marketCap: '$3.1T',
        peRatio: 35.8,
        eps: 11.60,
        dividendYield: 0.75,
        volume: 28450000,
      },
      dates: {
        signalDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString(),
      },
      reasoning: 'Cloud computing growth accelerating. AI integration driving revenue. Stable dividend yield with growth potential.',
    },
    {
      id: 'sig-005',
      ticker: 'JNJ',
      companyName: 'Johnson & Johnson',
      sector: 'Healthcare',
      signal: {
        type: 'HOLD',
        strength: 65,
        dominantAuthor: 'Graham',
        confidence: 70,
      },
      price: {
        current: 157.40,
        changePercent: 0.3,
        target: 170.00,
        stopLoss: 145.00,
      },
      trinityScores: {
        lynch: 62,
        oneil: 58,
        graham: 75,
        average: 65.0,
      },
      riskProfile: 'Conservative',
      fundamentals: {
        marketCap: '$390B',
        peRatio: 24.5,
        eps: 6.42,
        dividendYield: 3.05,
        volume: 8920000,
      },
      dates: {
        signalDate: new Date(Date.now() - 259200000).toISOString().split('T')[0], // 3 days ago
        lastUpdated: new Date().toISOString(),
      },
      reasoning: 'Defensive healthcare stock with consistent dividend. Litigation overhang limiting upside. Good for conservative portfolios.',
    },
  ],
};
