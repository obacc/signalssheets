// Mock data for Indicium Signals

export type SignalType = 'BUY' | 'SELL' | 'HOLD';
export type AuthorType = 'Lynch' | "O'Neil" | 'Graham';
export type RiskProfile = 'Conservative' | 'Moderate' | 'Aggressive';

export interface Signal {
  id: string;
  ticker: string;
  company: string;  // Using company for simplicity
  signal: SignalType;
  trinityScore: number;  // Single score for display
  dominantAuthor: AuthorType;
  authorScores: {
    lynch: number;
    oneil: number;
    graham: number;
  };
  price: number;
  targetPrice: number;
  stopLoss: number;
  potentialReturn: number;
  sector: string;
  riskProfile: RiskProfile;
  lastUpdated: Date;
}

export interface MarketRegimeData {
  current: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  vix: number;
  breadth: number;
  yieldCurve: number;
  dollarStrength: number;
  commodities: number;
  weights: {
    lynch: number;
    oneil: number;
    graham: number;
  };
  lastUpdated: Date;
}

export interface KPIMetrics {
  totalSignals: number;
  buySignals: number;
  avgTrinityScore: number;
  topGainer: {
    ticker: string;
    change: number;
  };
}

export const mockSignals: Signal[] = [
  {
    id: '1',
    ticker: 'NVDA',
    company: 'NVIDIA Corporation',
    signal: 'BUY',
    trinityScore: 95,
    dominantAuthor: "O'Neil",
    authorScores: { lynch: 88, oneil: 95, graham: 82 },
    price: 485.50,
    targetPrice: 575.40,
    stopLoss: 435.80,
    potentialReturn: 18.5,
    sector: 'Technology',
    riskProfile: 'Moderate',
    lastUpdated: new Date(),
  },
  {
    id: '2',
    ticker: 'MSFT',
    company: 'Microsoft Corporation',
    signal: 'BUY',
    trinityScore: 88,
    dominantAuthor: 'Lynch',
    authorScores: { lynch: 92, oneil: 85, graham: 87 },
    price: 378.25,
    targetPrice: 425.90,
    stopLoss: 355.20,
    potentialReturn: 12.6,
    sector: 'Technology',
    riskProfile: 'Conservative',
    lastUpdated: new Date(),
  },
  {
    id: '3',
    ticker: 'AAPL',
    company: 'Apple Inc.',
    signal: 'BUY',
    trinityScore: 85,
    dominantAuthor: 'Lynch',
    authorScores: { lynch: 90, oneil: 82, graham: 84 },
    price: 178.50,
    targetPrice: 195.30,
    stopLoss: 168.40,
    potentialReturn: 9.4,
    sector: 'Technology',
    riskProfile: 'Conservative',
    lastUpdated: new Date(),
  },
  {
    id: '4',
    ticker: 'AVGO',
    company: 'Broadcom Inc.',
    signal: 'BUY',
    trinityScore: 82,
    dominantAuthor: "O'Neil",
    authorScores: { lynch: 78, oneil: 88, graham: 75 },
    price: 852.30,
    targetPrice: 945.60,
    stopLoss: 802.10,
    potentialReturn: 10.9,
    sector: 'Technology',
    riskProfile: 'Moderate',
    lastUpdated: new Date(),
  },
  {
    id: '5',
    ticker: 'LLY',
    company: 'Eli Lilly and Company',
    signal: 'BUY',
    trinityScore: 90,
    dominantAuthor: 'Lynch',
    authorScores: { lynch: 94, oneil: 88, graham: 87 },
    price: 535.80,
    targetPrice: 625.40,
    stopLoss: 505.20,
    potentialReturn: 16.7,
    sector: 'Healthcare',
    riskProfile: 'Moderate',
    lastUpdated: new Date(),
  },
  {
    id: '6',
    ticker: 'UNH',
    company: 'UnitedHealth Group',
    signal: 'BUY',
    trinityScore: 84,
    dominantAuthor: 'Graham',
    authorScores: { lynch: 82, oneil: 80, graham: 90 },
    price: 512.40,
    targetPrice: 565.30,
    stopLoss: 488.70,
    potentialReturn: 10.3,
    sector: 'Healthcare',
    riskProfile: 'Conservative',
    lastUpdated: new Date(),
  },
  {
    id: '7',
    ticker: 'AMZN',
    company: 'Amazon.com Inc.',
    signal: 'BUY',
    trinityScore: 86,
    dominantAuthor: 'Lynch',
    authorScores: { lynch: 89, oneil: 85, graham: 84 },
    price: 142.40,
    targetPrice: 165.80,
    stopLoss: 133.90,
    potentialReturn: 16.4,
    sector: 'Consumer Discretionary',
    riskProfile: 'Moderate',
    lastUpdated: new Date(),
  },
  {
    id: '8',
    ticker: 'PTON',
    company: 'Peloton Interactive',
    signal: 'SELL',
    trinityScore: 85,
    dominantAuthor: 'Graham',
    authorScores: { lynch: 82, oneil: 78, graham: 92 },
    price: 8.50,
    targetPrice: 6.20,
    stopLoss: 9.80,
    potentialReturn: -27.1,
    sector: 'Consumer Discretionary',
    riskProfile: 'Aggressive',
    lastUpdated: new Date(),
  },
  {
    id: '9',
    ticker: 'JPM',
    company: 'JPMorgan Chase & Co.',
    signal: 'BUY',
    trinityScore: 81,
    dominantAuthor: 'Graham',
    authorScores: { lynch: 79, oneil: 76, graham: 88 },
    price: 143.60,
    targetPrice: 162.90,
    stopLoss: 136.20,
    potentialReturn: 13.4,
    sector: 'Financial',
    riskProfile: 'Conservative',
    lastUpdated: new Date(),
  },
  {
    id: '10',
    ticker: 'V',
    company: 'Visa Inc.',
    signal: 'BUY',
    trinityScore: 79,
    dominantAuthor: 'Lynch',
    authorScores: { lynch: 84, oneil: 76, graham: 77 },
    price: 268.90,
    targetPrice: 305.40,
    stopLoss: 254.30,
    potentialReturn: 13.6,
    sector: 'Financial',
    riskProfile: 'Moderate',
    lastUpdated: new Date(),
  },
  {
    id: '11',
    ticker: 'GOOGL',
    company: 'Alphabet Inc.',
    signal: 'HOLD',
    trinityScore: 78,
    dominantAuthor: 'Lynch',
    authorScores: { lynch: 82, oneil: 75, graham: 77 },
    price: 138.50,
    targetPrice: 152.90,
    stopLoss: 130.20,
    potentialReturn: 10.4,
    sector: 'Technology',
    riskProfile: 'Moderate',
    lastUpdated: new Date(),
  },
  {
    id: '12',
    ticker: 'TSLA',
    company: 'Tesla Inc.',
    signal: 'HOLD',
    trinityScore: 77,
    dominantAuthor: "O'Neil",
    authorScores: { lynch: 72, oneil: 83, graham: 68 },
    price: 248.30,
    targetPrice: 285.70,
    stopLoss: 232.10,
    potentialReturn: 15.1,
    sector: 'Consumer Discretionary',
    riskProfile: 'Aggressive',
    lastUpdated: new Date(),
  },
  {
    id: '13',
    ticker: 'AMD',
    company: 'Advanced Micro Devices',
    signal: 'BUY',
    trinityScore: 79,
    dominantAuthor: "O'Neil",
    authorScores: { lynch: 76, oneil: 84, graham: 74 },
    price: 115.75,
    targetPrice: 138.40,
    stopLoss: 108.20,
    potentialReturn: 19.6,
    sector: 'Technology',
    riskProfile: 'Aggressive',
    lastUpdated: new Date(),
  },
  {
    id: '14',
    ticker: 'META',
    company: 'Meta Platforms Inc.',
    signal: 'BUY',
    trinityScore: 83,
    dominantAuthor: "O'Neil",
    authorScores: { lynch: 80, oneil: 87, graham: 79 },
    price: 468.20,
    targetPrice: 532.90,
    stopLoss: 442.30,
    potentialReturn: 13.8,
    sector: 'Communication Services',
    riskProfile: 'Moderate',
    lastUpdated: new Date(),
  },
  {
    id: '15',
    ticker: 'COIN',
    company: 'Coinbase Global',
    signal: 'SELL',
    trinityScore: 82,
    dominantAuthor: "O'Neil",
    authorScores: { lynch: 70, oneil: 88, graham: 65 },
    price: 215.80,
    targetPrice: 178.40,
    stopLoss: 235.60,
    potentialReturn: -17.3,
    sector: 'Financial',
    riskProfile: 'Aggressive',
    lastUpdated: new Date(),
  },
  {
    id: '16',
    ticker: 'RIVN',
    company: 'Rivian Automotive',
    signal: 'SELL',
    trinityScore: 79,
    dominantAuthor: 'Graham',
    authorScores: { lynch: 68, oneil: 74, graham: 86 },
    price: 11.30,
    targetPrice: 8.90,
    stopLoss: 12.80,
    potentialReturn: -21.2,
    sector: 'Consumer Discretionary',
    riskProfile: 'Aggressive',
    lastUpdated: new Date(),
  },
  {
    id: '17',
    ticker: 'ABBV',
    company: 'AbbVie Inc.',
    signal: 'BUY',
    trinityScore: 78,
    dominantAuthor: 'Graham',
    authorScores: { lynch: 76, oneil: 72, graham: 85 },
    price: 165.40,
    targetPrice: 188.90,
    stopLoss: 156.80,
    potentialReturn: 14.2,
    sector: 'Healthcare',
    riskProfile: 'Conservative',
    lastUpdated: new Date(),
  },
  {
    id: '18',
    ticker: 'NOW',
    company: 'ServiceNow Inc.',
    signal: 'BUY',
    trinityScore: 80,
    dominantAuthor: 'Lynch',
    authorScores: { lynch: 85, oneil: 78, graham: 77 },
    price: 826.50,
    targetPrice: 945.20,
    stopLoss: 782.40,
    potentialReturn: 14.4,
    sector: 'Technology',
    riskProfile: 'Moderate',
    lastUpdated: new Date(),
  },
  {
    id: '19',
    ticker: 'PLTR',
    company: 'Palantir Technologies',
    signal: 'BUY',
    trinityScore: 85,
    dominantAuthor: "O'Neil",
    authorScores: { lynch: 80, oneil: 92, graham: 74 },
    price: 18.25,
    targetPrice: 24.80,
    stopLoss: 16.90,
    potentialReturn: 35.9,
    sector: 'Technology',
    riskProfile: 'Aggressive',
    lastUpdated: new Date(),
  },
  {
    id: '20',
    ticker: 'UBER',
    company: 'Uber Technologies',
    signal: 'HOLD',
    trinityScore: 76,
    dominantAuthor: 'Lynch',
    authorScores: { lynch: 80, oneil: 74, graham: 72 },
    price: 68.40,
    targetPrice: 78.90,
    stopLoss: 64.20,
    potentialReturn: 15.4,
    sector: 'Technology',
    riskProfile: 'Moderate',
    lastUpdated: new Date(),
  },
  {
    id: '21',
    ticker: 'M',
    company: "Macy's Inc.",
    signal: 'SELL',
    trinityScore: 76,
    dominantAuthor: 'Graham',
    authorScores: { lynch: 65, oneil: 68, graham: 82 },
    price: 17.80,
    targetPrice: 14.20,
    stopLoss: 19.50,
    potentialReturn: -20.2,
    sector: 'Consumer Discretionary',
    riskProfile: 'Moderate',
    lastUpdated: new Date(),
  },
];

export const mockMarketRegime: MarketRegimeData = {
  current: 'NEUTRAL',
  vix: 18.5,
  breadth: 65,
  yieldCurve: -0.15,
  dollarStrength: 102.5,
  commodities: 85.2,
  weights: {
    lynch: 35,
    oneil: 30,
    graham: 35,
  },
  lastUpdated: new Date(),
};

export const mockKPIs: KPIMetrics = {
  totalSignals: 60,
  buySignals: 24,
  avgTrinityScore: 70.2,
  topGainer: {
    ticker: 'PLTR',
    change: 5.8,
  },
};
