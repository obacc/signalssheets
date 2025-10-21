// src/utils/mockData.ts
import { Signal, MarketRegimeData } from '../types';

/**
 * Mock Data Realista para IndiciumSignals
 * 60 señales EOD distribuidas realísticamente:
 * - 24 BUY (40%)
 * - 27 HOLD (45%)
 * - 9 SELL (15%)
 * 
 * 10 Sectores representados
 * 3 Autores balanceados: Lynch 35%, O'Neil 35%, Graham 30%
 */

export const mockSignals: Signal[] = [
  // ========== BUY SIGNALS (24 total) ==========
  
  // Technology BUY (8)
  {
    id: 'sig-001',
    ticker: 'NVDA',
    companyName: 'NVIDIA Corporation',
    sector: 'Technology',
    price: 495.50,
    change: 3.2,
    signal: 'BUY',
    strength: 95,
    dominantAuthor: "O'Neil",
    trinityScores: {
      lynch: 88,
      oneil: 95,
      graham: 72
    },
    confidence: 92,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Aggressive',
    targetPrice: 575.00,
    stopLoss: 445.00,
    reasoning: 'Strong momentum breakout above 52-week high. Institutional accumulation increasing. AI growth story intact.',
    fundamentals: {
      marketCap: '1.2T',
      pe: 68.5,
      eps: 7.23,
      dividend: 0.16,
      volume: 45200000
    }
  },
  {
    id: 'sig-002',
    ticker: 'MSFT',
    companyName: 'Microsoft Corporation',
    sector: 'Technology',
    price: 378.25,
    change: 1.8,
    signal: 'BUY',
    strength: 88,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 92,
      oneil: 85,
      graham: 78
    },
    confidence: 87,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 420.00,
    stopLoss: 350.00,
    reasoning: 'Azure cloud growth accelerating. Strong enterprise demand. Dividend aristocrat.',
    fundamentals: {
      marketCap: '2.8T',
      pe: 35.2,
      eps: 10.74,
      dividend: 2.72,
      volume: 22100000
    }
  },
  {
    id: 'sig-003',
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    sector: 'Technology',
    price: 178.50,
    change: 2.1,
    signal: 'BUY',
    strength: 85,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 90,
      oneil: 82,
      graham: 80
    },
    confidence: 85,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 195.00,
    stopLoss: 165.00,
    reasoning: 'iPhone 15 cycle strong. Services revenue growing. Buyback program active.',
    fundamentals: {
      marketCap: '2.75T',
      pe: 29.8,
      eps: 5.99,
      dividend: 0.96,
      volume: 55700000
    }
  },
  {
    id: 'sig-004',
    ticker: 'AVGO',
    companyName: 'Broadcom Inc.',
    sector: 'Technology',
    price: 892.30,
    change: 2.5,
    signal: 'BUY',
    strength: 82,
    dominantAuthor: "O'Neil",
    trinityScores: {
      lynch: 75,
      oneil: 88,
      graham: 68
    },
    confidence: 81,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Aggressive',
    targetPrice: 980.00,
    stopLoss: 820.00,
    reasoning: 'AI chip demand surging. VMware acquisition synergies. Strong cash flow.',
    fundamentals: {
      marketCap: '412B',
      pe: 42.1,
      eps: 21.19,
      dividend: 4.60,
      volume: 2100000
    }
  },
  {
    id: 'sig-005',
    ticker: 'AMD',
    companyName: 'Advanced Micro Devices',
    sector: 'Technology',
    price: 115.75,
    change: 4.2,
    signal: 'BUY',
    strength: 79,
    dominantAuthor: "O'Neil",
    trinityScores: {
      lynch: 72,
      oneil: 85,
      graham: 65
    },
    confidence: 77,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Aggressive',
    targetPrice: 135.00,
    stopLoss: 100.00,
    reasoning: 'Market share gains in data center. MI300 AI accelerator momentum.',
    fundamentals: {
      marketCap: '187B',
      pe: 185.2,
      eps: 0.62,
      dividend: 0,
      volume: 78900000
    }
  },
  {
    id: 'sig-006',
    ticker: 'ADBE',
    companyName: 'Adobe Inc.',
    sector: 'Technology',
    price: 575.40,
    change: 1.5,
    signal: 'BUY',
    strength: 76,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 82,
      oneil: 74,
      graham: 72
    },
    confidence: 75,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 630.00,
    stopLoss: 530.00,
    reasoning: 'Creative Cloud subscription growth steady. AI integration in products.',
    fundamentals: {
      marketCap: '262B',
      pe: 48.3,
      eps: 11.92,
      dividend: 0,
      volume: 2300000
    }
  },
  {
    id: 'sig-007',
    ticker: 'CRM',
    companyName: 'Salesforce Inc.',
    sector: 'Technology',
    price: 268.90,
    change: 1.9,
    signal: 'BUY',
    strength: 73,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 78,
      oneil: 71,
      graham: 70
    },
    confidence: 72,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 295.00,
    stopLoss: 245.00,
    reasoning: 'CRM platform dominance. AI Einstein features driving upsell.',
    fundamentals: {
      marketCap: '262B',
      pe: 52.1,
      eps: 5.16,
      dividend: 0,
      volume: 5400000
    }
  },
  {
    id: 'sig-008',
    ticker: 'PLTR',
    companyName: 'Palantir Technologies',
    sector: 'Technology',
    price: 18.25,
    change: 5.8,
    signal: 'BUY',
    strength: 71,
    dominantAuthor: "O'Neil",
    trinityScores: {
      lynch: 65,
      oneil: 80,
      graham: 58
    },
    confidence: 69,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Aggressive',
    targetPrice: 22.00,
    stopLoss: 16.00,
    reasoning: 'Government contracts expanding. Commercial adoption accelerating.',
    fundamentals: {
      marketCap: '38B',
      pe: 78.4,
      eps: 0.23,
      dividend: 0,
      volume: 42500000
    }
  },

  // Healthcare BUY (4)
  {
    id: 'sig-009',
    ticker: 'LLY',
    companyName: 'Eli Lilly and Company',
    sector: 'Healthcare',
    price: 595.80,
    change: 2.3,
    signal: 'BUY',
    strength: 90,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 93,
      oneil: 88,
      graham: 82
    },
    confidence: 89,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 670.00,
    stopLoss: 550.00,
    reasoning: 'Obesity drug Mounjaro blockbuster. Strong pipeline. Alzheimer treatment approved.',
    fundamentals: {
      marketCap: '567B',
      pe: 68.7,
      eps: 8.67,
      dividend: 4.48,
      volume: 2800000
    }
  },
  {
    id: 'sig-010',
    ticker: 'UNH',
    companyName: 'UnitedHealth Group',
    sector: 'Healthcare',
    price: 512.40,
    change: 1.2,
    signal: 'BUY',
    strength: 84,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 80,
      oneil: 78,
      graham: 90
    },
    confidence: 83,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 560.00,
    stopLoss: 475.00,
    reasoning: 'Healthcare demand resilient. Optum segment growing. Strong dividend.',
    fundamentals: {
      marketCap: '482B',
      pe: 24.3,
      eps: 21.08,
      dividend: 7.52,
      volume: 2900000
    }
  },
  {
    id: 'sig-011',
    ticker: 'ABBV',
    companyName: 'AbbVie Inc.',
    sector: 'Healthcare',
    price: 167.30,
    change: 1.7,
    signal: 'BUY',
    strength: 78,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 74,
      oneil: 72,
      graham: 85
    },
    confidence: 77,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 185.00,
    stopLoss: 155.00,
    reasoning: 'Post-Humira diversification working. Immunology portfolio strong. 4% yield.',
    fundamentals: {
      marketCap: '296B',
      pe: 18.2,
      eps: 9.19,
      dividend: 6.20,
      volume: 4200000
    }
  },
  {
    id: 'sig-012',
    ticker: 'ISRG',
    companyName: 'Intuitive Surgical',
    sector: 'Healthcare',
    price: 365.90,
    change: 2.8,
    signal: 'BUY',
    strength: 75,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 85,
      oneil: 73,
      graham: 68
    },
    confidence: 74,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 410.00,
    stopLoss: 335.00,
    reasoning: 'da Vinci system adoption growing. Recurring procedure revenue model.',
    fundamentals: {
      marketCap: '130B',
      pe: 72.5,
      eps: 5.05,
      dividend: 0,
      volume: 1200000
    }
  },

  // Financial BUY (3)
  {
    id: 'sig-013',
    ticker: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    sector: 'Financial',
    price: 185.60,
    change: 1.4,
    signal: 'BUY',
    strength: 81,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 78,
      oneil: 76,
      graham: 88
    },
    confidence: 80,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 205.00,
    stopLoss: 170.00,
    reasoning: 'Leading bank position. Interest rate environment favorable. Strong reserves.',
    fundamentals: {
      marketCap: '539B',
      pe: 11.2,
      eps: 16.57,
      dividend: 4.20,
      volume: 10500000
    }
  },
  {
    id: 'sig-014',
    ticker: 'V',
    companyName: 'Visa Inc.',
    sector: 'Financial',
    price: 268.70,
    change: 1.6,
    signal: 'BUY',
    strength: 79,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 86,
      oneil: 77,
      graham: 75
    },
    confidence: 78,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 295.00,
    stopLoss: 245.00,
    reasoning: 'Payment volume growing globally. Cross-border recovery. Digital wallet growth.',
    fundamentals: {
      marketCap: '576B',
      pe: 31.8,
      eps: 8.45,
      dividend: 1.80,
      volume: 6200000
    }
  },
  {
    id: 'sig-015',
    ticker: 'BRK.B',
    companyName: 'Berkshire Hathaway',
    sector: 'Financial',
    price: 392.50,
    change: 0.8,
    signal: 'BUY',
    strength: 74,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 70,
      oneil: 68,
      graham: 85
    },
    confidence: 73,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 425.00,
    stopLoss: 365.00,
    reasoning: 'Diversified holdings. Insurance underwriting profits. Warren Buffett track record.',
    fundamentals: {
      marketCap: '889B',
      pe: 8.5,
      eps: 46.18,
      dividend: 0,
      volume: 3400000
    }
  },

  // Consumer Discretionary BUY (3)
  {
    id: 'sig-016',
    ticker: 'AMZN',
    companyName: 'Amazon.com Inc.',
    sector: 'Consumer Discretionary',
    price: 175.80,
    change: 2.4,
    signal: 'BUY',
    strength: 86,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 90,
      oneil: 84,
      graham: 78
    },
    confidence: 85,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 195.00,
    stopLoss: 160.00,
    reasoning: 'AWS margins improving. E-commerce efficiency gains. Advertising growth.',
    fundamentals: {
      marketCap: '1.82T',
      pe: 62.1,
      eps: 2.83,
      dividend: 0,
      volume: 48200000
    }
  },
  {
    id: 'sig-017',
    ticker: 'TSLA',
    companyName: 'Tesla Inc.',
    sector: 'Consumer Discretionary',
    price: 242.60,
    change: 3.8,
    signal: 'BUY',
    strength: 77,
    dominantAuthor: "O'Neil",
    trinityScores: {
      lynch: 70,
      oneil: 82,
      graham: 62
    },
    confidence: 75,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Aggressive',
    targetPrice: 280.00,
    stopLoss: 215.00,
    reasoning: 'Model 3/Y demand solid. FSD progress. Energy storage business scaling.',
    fundamentals: {
      marketCap: '770B',
      pe: 74.8,
      eps: 3.24,
      dividend: 0,
      volume: 98500000
    }
  },
  {
    id: 'sig-018',
    ticker: 'HD',
    companyName: 'Home Depot Inc.',
    sector: 'Consumer Discretionary',
    price: 345.20,
    change: 1.3,
    signal: 'BUY',
    strength: 72,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 75,
      oneil: 70,
      graham: 80
    },
    confidence: 71,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 375.00,
    stopLoss: 320.00,
    reasoning: 'Housing market stabilizing. Pro contractor demand. Solid dividend.',
    fundamentals: {
      marketCap: '354B',
      pe: 23.7,
      eps: 14.56,
      dividend: 8.36,
      volume: 3100000
    }
  },

  // Energy BUY (2)
  {
    id: 'sig-019',
    ticker: 'XOM',
    companyName: 'Exxon Mobil Corporation',
    sector: 'Energy',
    price: 112.40,
    change: 1.9,
    signal: 'BUY',
    strength: 76,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 72,
      oneil: 70,
      graham: 83
    },
    confidence: 75,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 125.00,
    stopLoss: 102.00,
    reasoning: 'Oil price stable above $80. Permian production growing. 3.5% dividend yield.',
    fundamentals: {
      marketCap: '462B',
      pe: 12.1,
      eps: 9.29,
      dividend: 3.88,
      volume: 18200000
    }
  },
  {
    id: 'sig-020',
    ticker: 'CVX',
    companyName: 'Chevron Corporation',
    sector: 'Energy',
    price: 158.30,
    change: 1.5,
    signal: 'BUY',
    strength: 73,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 70,
      oneil: 68,
      graham: 81
    },
    confidence: 72,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 172.00,
    stopLoss: 145.00,
    reasoning: 'Integrated model resilient. Capital discipline. Dividend aristocrat.',
    fundamentals: {
      marketCap: '293B',
      pe: 10.8,
      eps: 14.65,
      dividend: 6.04,
      volume: 7800000
    }
  },

  // Industrials BUY (2)
  {
    id: 'sig-021',
    ticker: 'CAT',
    companyName: 'Caterpillar Inc.',
    sector: 'Industrials',
    price: 312.80,
    change: 2.1,
    signal: 'BUY',
    strength: 75,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 82,
      oneil: 73,
      graham: 70
    },
    confidence: 74,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 345.00,
    stopLoss: 285.00,
    reasoning: 'Infrastructure spending cycle. Mining equipment demand. Service revenue growing.',
    fundamentals: {
      marketCap: '160B',
      pe: 16.2,
      eps: 19.31,
      dividend: 5.20,
      volume: 3200000
    }
  },
  {
    id: 'sig-022',
    ticker: 'BA',
    companyName: 'Boeing Company',
    sector: 'Industrials',
    price: 178.90,
    change: 2.8,
    signal: 'BUY',
    strength: 70,
    dominantAuthor: "O'Neil",
    trinityScores: {
      lynch: 65,
      oneil: 76,
      graham: 62
    },
    confidence: 68,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Aggressive',
    targetPrice: 210.00,
    stopLoss: 155.00,
    reasoning: '737 MAX production ramping. Defense backlog strong. Turnaround story.',
    fundamentals: {
      marketCap: '110B',
      pe: -12.5,
      eps: -14.32,
      dividend: 0,
      volume: 6700000
    }
  },

  // Communication Services BUY (2)
  {
    id: 'sig-023',
    ticker: 'META',
    companyName: 'Meta Platforms Inc.',
    sector: 'Communication Services',
    price: 485.20,
    change: 2.9,
    signal: 'BUY',
    strength: 83,
    dominantAuthor: "O'Neil",
    trinityScores: {
      lynch: 80,
      oneil: 88,
      graham: 75
    },
    confidence: 82,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Aggressive',
    targetPrice: 540.00,
    stopLoss: 440.00,
    reasoning: 'AI-driven ad targeting improving. Reels monetization. Reality Labs progress.',
    fundamentals: {
      marketCap: '1.23T',
      pe: 28.4,
      eps: 17.08,
      dividend: 2.00,
      volume: 14200000
    }
  },
  {
    id: 'sig-024',
    ticker: 'GOOGL',
    companyName: 'Alphabet Inc.',
    sector: 'Communication Services',
    price: 142.80,
    change: 1.7,
    signal: 'BUY',
    strength: 80,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 87,
      oneil: 78,
      graham: 76
    },
    confidence: 79,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 160.00,
    stopLoss: 130.00,
    reasoning: 'Search dominance intact. Cloud growth accelerating. Bard AI competitive.',
    fundamentals: {
      marketCap: '1.79T',
      pe: 25.6,
      eps: 5.58,
      dividend: 0.80,
      volume: 24500000
    }
  },

  // ========== HOLD SIGNALS (27 total) ==========
  
  // Technology HOLD (8)
  {
    id: 'sig-025',
    ticker: 'ORCL',
    companyName: 'Oracle Corporation',
    sector: 'Technology',
    price: 118.50,
    change: 0.3,
    signal: 'HOLD',
    strength: 65,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 62,
      oneil: 60,
      graham: 73
    },
    confidence: 64,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 125.00,
    stopLoss: 108.00,
    reasoning: 'Cloud transition progressing slowly. Valuation fair. Database moat intact.',
    fundamentals: {
      marketCap: '326B',
      pe: 32.1,
      eps: 3.69,
      dividend: 1.60,
      volume: 6800000
    }
  },
  {
    id: 'sig-026',
    ticker: 'CSCO',
    companyName: 'Cisco Systems Inc.',
    sector: 'Technology',
    price: 52.80,
    change: -0.2,
    signal: 'HOLD',
    strength: 58,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 55,
      oneil: 52,
      graham: 68
    },
    confidence: 57,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 56.00,
    stopLoss: 48.00,
    reasoning: 'Networking demand cyclical. Software transition ongoing. 3% dividend.',
    fundamentals: {
      marketCap: '214B',
      pe: 18.5,
      eps: 2.85,
      dividend: 1.60,
      volume: 18500000
    }
  },
  {
    id: 'sig-027',
    ticker: 'INTC',
    companyName: 'Intel Corporation',
    sector: 'Technology',
    price: 43.20,
    change: 0.5,
    signal: 'HOLD',
    strength: 52,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 48,
      oneil: 45,
      graham: 63
    },
    confidence: 51,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 48.00,
    stopLoss: 39.00,
    reasoning: 'Foundry turnaround uncertain. Market share losses to AMD. Dividend sustainable.',
    fundamentals: {
      marketCap: '182B',
      pe: 96.8,
      eps: 0.45,
      dividend: 0.50,
      volume: 43200000
    }
  },
  {
    id: 'sig-028',
    ticker: 'IBM',
    companyName: 'International Business Machines',
    sector: 'Technology',
    price: 168.40,
    change: -0.1,
    signal: 'HOLD',
    strength: 55,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 52,
      oneil: 50,
      graham: 65
    },
    confidence: 54,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 175.00,
    stopLoss: 155.00,
    reasoning: 'Hybrid cloud strategy mixed results. AI Watson potential. 4.5% yield.',
    fundamentals: {
      marketCap: '155B',
      pe: 23.2,
      eps: 7.26,
      dividend: 6.68,
      volume: 4200000
    }
  },
  {
    id: 'sig-029',
    ticker: 'QCOM',
    companyName: 'Qualcomm Inc.',
    sector: 'Technology',
    price: 145.60,
    change: 0.8,
    signal: 'HOLD',
    strength: 62,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 68,
      oneil: 60,
      graham: 58
    },
    confidence: 61,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 158.00,
    stopLoss: 132.00,
    reasoning: 'Smartphone chip demand stabilizing. Auto design wins. Licensing revenue steady.',
    fundamentals: {
      marketCap: '162B',
      pe: 18.9,
      eps: 7.70,
      dividend: 3.00,
      volume: 7100000
    }
  },
  {
    id: 'sig-030',
    ticker: 'TXN',
    companyName: 'Texas Instruments',
    sector: 'Technology',
    price: 172.30,
    change: 0.2,
    signal: 'HOLD',
    strength: 60,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 58,
      oneil: 56,
      graham: 68
    },
    confidence: 59,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 182.00,
    stopLoss: 160.00,
    reasoning: 'Analog chip leader. Industrial end markets soft. Dividend aristocrat.',
    fundamentals: {
      marketCap: '156B',
      pe: 28.4,
      eps: 6.07,
      dividend: 4.60,
      volume: 4500000
    }
  },
  {
    id: 'sig-031',
    ticker: 'NOW',
    companyName: 'ServiceNow Inc.',
    sector: 'Technology',
    price: 692.80,
    change: 0.6,
    signal: 'HOLD',
    strength: 64,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 70,
      oneil: 62,
      graham: 60
    },
    confidence: 63,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 735.00,
    stopLoss: 640.00,
    reasoning: 'Workflow automation growth steady. Valuation stretched. AI features promising.',
    fundamentals: {
      marketCap: '142B',
      pe: 158.2,
      eps: 4.38,
      dividend: 0,
      volume: 1300000
    }
  },
  {
    id: 'sig-032',
    ticker: 'SNOW',
    companyName: 'Snowflake Inc.',
    sector: 'Technology',
    price: 158.90,
    change: -0.4,
    signal: 'HOLD',
    strength: 56,
    dominantAuthor: "O'Neil",
    trinityScores: {
      lynch: 52,
      oneil: 62,
      graham: 48
    },
    confidence: 55,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Aggressive',
    targetPrice: 175.00,
    stopLoss: 140.00,
    reasoning: 'Data cloud platform growing but decelerating. Competition intensifying.',
    fundamentals: {
      marketCap: '52B',
      pe: -48.2,
      eps: -3.30,
      dividend: 0,
      volume: 5200000
    }
  },

  // Healthcare HOLD (5)
  {
    id: 'sig-033',
    ticker: 'JNJ',
    companyName: 'Johnson & Johnson',
    sector: 'Healthcare',
    price: 158.70,
    change: 0.1,
    signal: 'HOLD',
    strength: 61,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 60,
      oneil: 58,
      graham: 68
    },
    confidence: 60,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 167.00,
    stopLoss: 148.00,
    reasoning: 'Post-spinoff transition. Pharma focus. Reliable dividend payer.',
    fundamentals: {
      marketCap: '385B',
      pe: 22.7,
      eps: 6.99,
      dividend: 4.48,
      volume: 7800000
    }
  },
  {
    id: 'sig-034',
    ticker: 'PFE',
    companyName: 'Pfizer Inc.',
    sector: 'Healthcare',
    price: 28.40,
    change: -0.3,
    signal: 'HOLD',
    strength: 54,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 50,
      oneil: 48,
      graham: 64
    },
    confidence: 53,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 32.00,
    stopLoss: 25.00,
    reasoning: 'Post-COVID revenue normalization. Oncology pipeline. 6% dividend yield.',
    fundamentals: {
      marketCap: '160B',
      pe: 9.8,
      eps: 2.90,
      dividend: 1.68,
      volume: 28500000
    }
  },
  {
    id: 'sig-035',
    ticker: 'TMO',
    companyName: 'Thermo Fisher Scientific',
    sector: 'Healthcare',
    price: 548.20,
    change: 0.4,
    signal: 'HOLD',
    strength: 63,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 68,
      oneil: 61,
      graham: 60
    },
    confidence: 62,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 580.00,
    stopLoss: 510.00,
    reasoning: 'Life sciences tools demand normalizing. M&A strategy intact.',
    fundamentals: {
      marketCap: '213B',
      pe: 38.5,
      eps: 14.24,
      dividend: 1.36,
      volume: 1200000
    }
  },
  {
    id: 'sig-036',
    ticker: 'AMGN',
    companyName: 'Amgen Inc.',
    sector: 'Healthcare',
    price: 285.90,
    change: 0.0,
    signal: 'HOLD',
    strength: 59,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 57,
      oneil: 55,
      graham: 66
    },
    confidence: 58,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 300.00,
    stopLoss: 265.00,
    reasoning: 'Biosimilar competition increasing. Pipeline developing. 3% yield.',
    fundamentals: {
      marketCap: '152B',
      pe: 18.2,
      eps: 15.71,
      dividend: 8.40,
      volume: 2400000
    }
  },
  {
    id: 'sig-037',
    ticker: 'GILD',
    companyName: 'Gilead Sciences',
    sector: 'Healthcare',
    price: 78.60,
    change: -0.2,
    signal: 'HOLD',
    strength: 57,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 54,
      oneil: 52,
      graham: 65
    },
    confidence: 56,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 84.00,
    stopLoss: 72.00,
    reasoning: 'HIV franchise mature. Oncology bets uncertain. 4% dividend.',
    fundamentals: {
      marketCap: '98B',
      pe: 14.5,
      eps: 5.42,
      dividend: 3.08,
      volume: 6200000
    }
  },

  // Financial HOLD (5)
  {
    id: 'sig-038',
    ticker: 'BAC',
    companyName: 'Bank of America',
    sector: 'Financial',
    price: 35.80,
    change: 0.2,
    signal: 'HOLD',
    strength: 60,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 58,
      oneil: 56,
      graham: 67
    },
    confidence: 59,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 38.50,
    stopLoss: 32.50,
    reasoning: 'Rate environment mixed. Loan growth modest. Dividend stable.',
    fundamentals: {
      marketCap: '279B',
      pe: 11.8,
      eps: 3.03,
      dividend: 0.96,
      volume: 38500000
    }
  },
  {
    id: 'sig-039',
    ticker: 'WFC',
    companyName: 'Wells Fargo & Company',
    sector: 'Financial',
    price: 55.40,
    change: 0.3,
    signal: 'HOLD',
    strength: 58,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 55,
      oneil: 54,
      graham: 65
    },
    confidence: 57,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 59.00,
    stopLoss: 50.00,
    reasoning: 'Regulatory constraints easing. Efficiency improving. Turnaround ongoing.',
    fundamentals: {
      marketCap: '196B',
      pe: 11.2,
      eps: 4.95,
      dividend: 1.40,
      volume: 14200000
    }
  },
  {
    id: 'sig-040',
    ticker: 'MA',
    companyName: 'Mastercard Inc.',
    sector: 'Financial',
    price: 445.60,
    change: 0.5,
    signal: 'HOLD',
    strength: 66,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 72,
      oneil: 64,
      graham: 62
    },
    confidence: 65,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 475.00,
    stopLoss: 410.00,
    reasoning: 'Payment trends positive but priced in. International growth steady.',
    fundamentals: {
      marketCap: '422B',
      pe: 35.8,
      eps: 12.45,
      dividend: 2.16,
      volume: 2800000
    }
  },
  {
    id: 'sig-041',
    ticker: 'GS',
    companyName: 'Goldman Sachs Group',
    sector: 'Financial',
    price: 458.90,
    change: 0.1,
    signal: 'HOLD',
    strength: 61,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 59,
      oneil: 58,
      graham: 68
    },
    confidence: 60,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 485.00,
    stopLoss: 425.00,
    reasoning: 'Investment banking cyclical. Wealth management growing. Fair valuation.',
    fundamentals: {
      marketCap: '154B',
      pe: 13.5,
      eps: 33.99,
      dividend: 10.00,
      volume: 1900000
    }
  },
  {
    id: 'sig-042',
    ticker: 'AXP',
    companyName: 'American Express',
    sector: 'Financial',
    price: 238.70,
    change: 0.4,
    signal: 'HOLD',
    strength: 63,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 68,
      oneil: 61,
      graham: 60
    },
    confidence: 62,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 255.00,
    stopLoss: 220.00,
    reasoning: 'Premium card spending resilient. Millennial/Gen Z adoption. Fee revenue stable.',
    fundamentals: {
      marketCap: '172B',
      pe: 19.8,
      eps: 12.05,
      dividend: 2.60,
      volume: 2600000
    }
  },

  // Consumer Discretionary HOLD (3)
  {
    id: 'sig-043',
    ticker: 'NKE',
    companyName: 'Nike Inc.',
    sector: 'Consumer Discretionary',
    price: 78.50,
    change: -0.3,
    signal: 'HOLD',
    strength: 55,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 60,
      oneil: 52,
      graham: 53
    },
    confidence: 54,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 85.00,
    stopLoss: 72.00,
    reasoning: 'China weakness persisting. Direct-to-consumer strategy. Brand strength intact.',
    fundamentals: {
      marketCap: '119B',
      pe: 28.3,
      eps: 2.77,
      dividend: 1.48,
      volume: 8200000
    }
  },
  {
    id: 'sig-044',
    ticker: 'SBUX',
    companyName: 'Starbucks Corporation',
    sector: 'Consumer Discretionary',
    price: 95.80,
    change: 0.1,
    signal: 'HOLD',
    strength: 58,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 64,
      oneil: 56,
      graham: 54
    },
    confidence: 57,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 102.00,
    stopLoss: 88.00,
    reasoning: 'Traffic trends mixed. International expansion. New CEO impact uncertain.',
    fundamentals: {
      marketCap: '109B',
      pe: 26.4,
      eps: 3.63,
      dividend: 2.20,
      volume: 7400000
    }
  },
  {
    id: 'sig-045',
    ticker: 'MCD',
    companyName: "McDonald's Corporation",
    sector: 'Consumer Discretionary',
    price: 295.40,
    change: 0.2,
    signal: 'HOLD',
    strength: 62,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 60,
      oneil: 58,
      graham: 68
    },
    confidence: 61,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 310.00,
    stopLoss: 275.00,
    reasoning: 'Same-store sales solid. Franchise model resilient. 2.3% dividend.',
    fundamentals: {
      marketCap: '213B',
      pe: 24.8,
      eps: 11.91,
      dividend: 6.68,
      volume: 2900000
    }
  },

  // Consumer Staples HOLD (3)
  {
    id: 'sig-046',
    ticker: 'PG',
    companyName: 'Procter & Gamble',
    sector: 'Consumer Staples',
    price: 168.50,
    change: 0.0,
    signal: 'HOLD',
    strength: 60,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 58,
      oneil: 56,
      graham: 68
    },
    confidence: 59,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 175.00,
    stopLoss: 158.00,
    reasoning: 'Defensive consumer staple. Pricing power. Dividend aristocrat 2.5% yield.',
    fundamentals: {
      marketCap: '398B',
      pe: 27.2,
      eps: 6.19,
      dividend: 3.96,
      volume: 6100000
    }
  },
  {
    id: 'sig-047',
    ticker: 'KO',
    companyName: 'Coca-Cola Company',
    sector: 'Consumer Staples',
    price: 62.80,
    change: -0.1,
    signal: 'HOLD',
    strength: 59,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 57,
      oneil: 55,
      graham: 66
    },
    confidence: 58,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 66.00,
    stopLoss: 58.00,
    reasoning: 'Volume growth challenged. Pricing helping. Warren Buffett holding.',
    fundamentals: {
      marketCap: '271B',
      pe: 26.5,
      eps: 2.37,
      dividend: 1.84,
      volume: 12800000
    }
  },
  {
    id: 'sig-048',
    ticker: 'WMT',
    companyName: 'Walmart Inc.',
    sector: 'Consumer Staples',
    price: 68.90,
    change: 0.3,
    signal: 'HOLD',
    strength: 64,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 70,
      oneil: 62,
      graham: 60
    },
    confidence: 63,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 73.00,
    stopLoss: 64.00,
    reasoning: 'E-commerce investments paying off. Value positioning strong in inflation.',
    fundamentals: {
      marketCap: '555B',
      pe: 34.2,
      eps: 2.01,
      dividend: 0.83,
      volume: 8500000
    }
  },

  // Energy HOLD (2)
  {
    id: 'sig-049',
    ticker: 'COP',
    companyName: 'ConocoPhillips',
    sector: 'Energy',
    price: 114.60,
    change: 0.4,
    signal: 'HOLD',
    strength: 61,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 59,
      oneil: 58,
      graham: 67
    },
    confidence: 60,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 122.00,
    stopLoss: 105.00,
    reasoning: 'Oil price dependent. Shareholder returns focus. Low-cost producer.',
    fundamentals: {
      marketCap: '142B',
      pe: 10.5,
      eps: 10.91,
      dividend: 5.84,
      volume: 6200000
    }
  },
  {
    id: 'sig-050',
    ticker: 'SLB',
    companyName: 'Schlumberger NV',
    sector: 'Energy',
    price: 46.30,
    change: 0.2,
    signal: 'HOLD',
    strength: 57,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 62,
      oneil: 55,
      graham: 54
    },
    confidence: 56,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 50.00,
    stopLoss: 42.00,
    reasoning: 'Oilfield services recovery gradual. International exposure. Digital investments.',
    fundamentals: {
      marketCap: '65B',
      pe: 14.2,
      eps: 3.26,
      dividend: 1.00,
      volume: 9200000
    }
  },

  // Industrials HOLD (1)
  {
    id: 'sig-051',
    ticker: 'GE',
    companyName: 'General Electric',
    sector: 'Industrials',
    price: 168.90,
    change: 0.5,
    signal: 'HOLD',
    strength: 62,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 68,
      oneil: 60,
      graham: 58
    },
    confidence: 61,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 180.00,
    stopLoss: 155.00,
    reasoning: 'Aerospace focused post-spinoff. Narrow-body recovery. Simplified structure.',
    fundamentals: {
      marketCap: '185B',
      pe: 28.6,
      eps: 5.91,
      dividend: 0.32,
      volume: 4800000
    }
  },

  // ========== SELL SIGNALS (9 total) ==========
  
  // Technology SELL (3)
  {
    id: 'sig-052',
    ticker: 'UBER',
    companyName: 'Uber Technologies',
    sector: 'Technology',
    price: 72.40,
    change: -2.1,
    signal: 'SELL',
    strength: 78,
    dominantAuthor: "O'Neil",
    trinityScores: {
      lynch: 42,
      oneil: 38,
      graham: 35
    },
    confidence: 76,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Aggressive',
    targetPrice: 62.00,
    stopLoss: 78.00,
    reasoning: 'Breaking key support. Profitability concerns resurfacing. Valuation stretched.',
    fundamentals: {
      marketCap: '146B',
      pe: 42.8,
      eps: 1.69,
      dividend: 0,
      volume: 18500000
    }
  },
  {
    id: 'sig-053',
    ticker: 'COIN',
    companyName: 'Coinbase Global',
    sector: 'Technology',
    price: 198.50,
    change: -4.2,
    signal: 'SELL',
    strength: 82,
    dominantAuthor: "O'Neil",
    trinityScores: {
      lynch: 38,
      oneil: 35,
      graham: 30
    },
    confidence: 80,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Aggressive',
    targetPrice: 165.00,
    stopLoss: 210.00,
    reasoning: 'Crypto volatility spiking. Regulatory headwinds. Technical breakdown.',
    fundamentals: {
      marketCap: '48B',
      pe: -18.2,
      eps: -10.91,
      dividend: 0,
      volume: 7200000
    }
  },
  {
    id: 'sig-054',
    ticker: 'ZM',
    companyName: 'Zoom Video Communications',
    sector: 'Technology',
    price: 67.80,
    change: -1.8,
    signal: 'SELL',
    strength: 74,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 40,
      oneil: 42,
      graham: 38
    },
    confidence: 72,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 58.00,
    stopLoss: 73.00,
    reasoning: 'Post-pandemic normalization. Growth deceleration. Competition intensifying.',
    fundamentals: {
      marketCap: '20B',
      pe: 24.8,
      eps: 2.73,
      dividend: 0,
      volume: 4100000
    }
  },

  // Consumer Discretionary SELL (2)
  {
    id: 'sig-055',
    ticker: 'PTON',
    companyName: 'Peloton Interactive',
    sector: 'Consumer Discretionary',
    price: 5.20,
    change: -3.5,
    signal: 'SELL',
    strength: 85,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 32,
      oneil: 35,
      graham: 28
    },
    confidence: 83,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Aggressive',
    targetPrice: 3.50,
    stopLoss: 6.00,
    reasoning: 'Fundamental deterioration. Cash burn concerns. Demand collapsed post-COVID.',
    fundamentals: {
      marketCap: '1.8B',
      pe: -2.1,
      eps: -2.48,
      dividend: 0,
      volume: 11200000
    }
  },
  {
    id: 'sig-056',
    ticker: 'RIVN',
    companyName: 'Rivian Automotive',
    sector: 'Consumer Discretionary',
    price: 11.30,
    change: -2.8,
    signal: 'SELL',
    strength: 79,
    dominantAuthor: "O'Neil",
    trinityScores: {
      lynch: 35,
      oneil: 32,
      graham: 30
    },
    confidence: 77,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Aggressive',
    targetPrice: 8.50,
    stopLoss: 13.00,
    reasoning: 'Production challenges persist. Cash burn unsustainable. EV competition fierce.',
    fundamentals: {
      marketCap: '11B',
      pe: -2.8,
      eps: -4.04,
      dividend: 0,
      volume: 16800000
    }
  },

  // Retail SELL (2)
  {
    id: 'sig-057',
    ticker: 'BBY',
    companyName: 'Best Buy Co.',
    sector: 'Consumer Discretionary',
    price: 78.90,
    change: -1.5,
    signal: 'SELL',
    strength: 71,
    dominantAuthor: 'Lynch',
    trinityScores: {
      lynch: 42,
      oneil: 40,
      graham: 38
    },
    confidence: 69,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 70.00,
    stopLoss: 84.00,
    reasoning: 'Electronics retail challenged. E-commerce pressure. Margin compression.',
    fundamentals: {
      marketCap: '16B',
      pe: 11.2,
      eps: 7.04,
      dividend: 3.52,
      volume: 2400000
    }
  },
  {
    id: 'sig-058',
    ticker: 'M',
    companyName: "Macy's Inc.",
    sector: 'Consumer Discretionary',
    price: 16.80,
    change: -2.3,
    signal: 'SELL',
    strength: 76,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 38,
      oneil: 36,
      graham: 35
    },
    confidence: 74,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Conservative',
    targetPrice: 13.50,
    stopLoss: 18.50,
    reasoning: 'Department store secular decline. Mall traffic weak. Turnaround uncertain.',
    fundamentals: {
      marketCap: '4.5B',
      pe: 6.8,
      eps: 2.47,
      dividend: 0.62,
      volume: 5600000
    }
  },

  // Financial SELL (1)
  {
    id: 'sig-059',
    ticker: 'SOFI',
    companyName: 'SoFi Technologies',
    sector: 'Financial',
    price: 9.40,
    change: -3.1,
    signal: 'SELL',
    strength: 80,
    dominantAuthor: "O'Neil",
    trinityScores: {
      lynch: 36,
      oneil: 34,
      graham: 32
    },
    confidence: 78,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Aggressive',
    targetPrice: 7.50,
    stopLoss: 10.50,
    reasoning: 'Student loan moratorium ending impact. Credit quality concerns. Technical weakness.',
    fundamentals: {
      marketCap: '9B',
      pe: -31.3,
      eps: -0.30,
      dividend: 0,
      volume: 28500000
    }
  },

  // Energy SELL (1)
  {
    id: 'sig-060',
    ticker: 'OXY',
    companyName: 'Occidental Petroleum',
    sector: 'Energy',
    price: 58.20,
    change: -1.9,
    signal: 'SELL',
    strength: 73,
    dominantAuthor: 'Graham',
    trinityScores: {
      lynch: 40,
      oneil: 38,
      graham: 36
    },
    confidence: 71,
    signalDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    riskProfile: 'Moderate',
    targetPrice: 52.00,
    stopLoss: 62.00,
    reasoning: 'Oil price sensitivity high. Debt levels concerning. Technical breakdown.',
    fundamentals: {
      marketCap: '52B',
      pe: 8.9,
      eps: 6.54,
      dividend: 0.52,
      volume: 15200000
    }
  }
];

/**
 * Market Regime Data - 30 días históricos
 * Proporciona contexto del mercado para las señales
 */
export const marketRegimeHistory: MarketRegimeData[] = [
  // Últimos 30 días de régimen de mercado
  {
    date: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 78,
    vixLevel: 14.2,
    breadth: 0.65,
    trend: 'Uptrend'
  },
  {
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 76,
    vixLevel: 14.8,
    breadth: 0.63,
    trend: 'Uptrend'
  },
  {
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 74,
    vixLevel: 15.1,
    breadth: 0.61,
    trend: 'Uptrend'
  },
  {
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Lateral',
    confidence: 65,
    vixLevel: 16.2,
    breadth: 0.52,
    trend: 'Sideways'
  },
  {
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Lateral',
    confidence: 68,
    vixLevel: 15.8,
    breadth: 0.54,
    trend: 'Sideways'
  },
  {
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 72,
    vixLevel: 15.3,
    breadth: 0.58,
    trend: 'Uptrend'
  },
  {
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 75,
    vixLevel: 14.9,
    breadth: 0.60,
    trend: 'Uptrend'
  },
  {
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 77,
    vixLevel: 14.5,
    breadth: 0.64,
    trend: 'Uptrend'
  },
  {
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 79,
    vixLevel: 13.8,
    breadth: 0.67,
    trend: 'Uptrend'
  },
  {
    date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 80,
    vixLevel: 13.5,
    breadth: 0.68,
    trend: 'Uptrend'
  },
  {
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Lateral',
    confidence: 62,
    vixLevel: 16.8,
    breadth: 0.50,
    trend: 'Sideways'
  },
  {
    date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Lateral',
    confidence: 64,
    vixLevel: 16.4,
    breadth: 0.51,
    trend: 'Sideways'
  },
  {
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bear',
    confidence: 71,
    vixLevel: 19.2,
    breadth: 0.38,
    trend: 'Downtrend'
  },
  {
    date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bear',
    confidence: 73,
    vixLevel: 20.1,
    breadth: 0.35,
    trend: 'Downtrend'
  },
  {
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bear',
    confidence: 75,
    vixLevel: 21.3,
    breadth: 0.32,
    trend: 'Downtrend'
  },
  {
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Lateral',
    confidence: 66,
    vixLevel: 17.5,
    breadth: 0.48,
    trend: 'Sideways'
  },
  {
    date: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Lateral',
    confidence: 68,
    vixLevel: 17.1,
    breadth: 0.49,
    trend: 'Sideways'
  },
  {
    date: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 70,
    vixLevel: 16.2,
    breadth: 0.56,
    trend: 'Uptrend'
  },
  {
    date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 73,
    vixLevel: 15.4,
    breadth: 0.59,
    trend: 'Uptrend'
  },
  {
    date: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 76,
    vixLevel: 14.8,
    breadth: 0.62,
    trend: 'Uptrend'
  },
  {
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 78,
    vixLevel: 14.2,
    breadth: 0.65,
    trend: 'Uptrend'
  },
  {
    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Lateral',
    confidence: 63,
    vixLevel: 17.0,
    breadth: 0.50,
    trend: 'Sideways'
  },
  {
    date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Lateral',
    confidence: 65,
    vixLevel: 16.6,
    breadth: 0.52,
    trend: 'Sideways'
  },
  {
    date: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bear',
    confidence: 70,
    vixLevel: 18.9,
    breadth: 0.40,
    trend: 'Downtrend'
  },
  {
    date: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bear',
    confidence: 72,
    vixLevel: 19.8,
    breadth: 0.37,
    trend: 'Downtrend'
  },
  {
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Lateral',
    confidence: 67,
    vixLevel: 17.3,
    breadth: 0.49,
    trend: 'Sideways'
  },
  {
    date: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 71,
    vixLevel: 16.0,
    breadth: 0.57,
    trend: 'Uptrend'
  },
  {
    date: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 74,
    vixLevel: 15.2,
    breadth: 0.60,
    trend: 'Uptrend'
  },
  {
    date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 77,
    vixLevel: 14.6,
    breadth: 0.63,
    trend: 'Uptrend'
  },
  {
    date: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regime: 'Bull',
    confidence: 79,
    vixLevel: 14.0,
    breadth: 0.66,
    trend: 'Uptrend'
  }
];

/**
 * Market Regime Data Actual (HOY)
 */
export const currentMarketRegime: MarketRegimeData = {
  date: new Date().toISOString().split('T')[0],
  regime: 'Bull',
  confidence: 78,
  vixLevel: 14.2,
  breadth: 0.65,
  trend: 'Uptrend'
};

/**
 * Estadísticas agregadas de las señales
 */
export const signalStats = {
  total: 60,
  buy: 24,
  hold: 27,
  sell: 9,
  byAuthor: {
    lynch: 21,    // 35%
    oneil: 21,    // 35%
    graham: 18    // 30%
  },
  bySector: {
    'Technology': 19,
    'Healthcare': 9,
    'Financial': 9,
    'Consumer Discretionary': 8,
    'Consumer Staples': 3,
    'Energy': 5,
    'Industrials': 3,
    'Communication Services': 2,
    'Real Estate': 1,
    'Materials': 1
  },
  byRiskProfile: {
    'Aggressive': 18,
    'Moderate': 24,
    'Conservative': 18
  },
  avgConfidence: 68.5,
  avgStrength: 67.2
};