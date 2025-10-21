import type { Signal, AuthorType, RiskProfile } from '../types'

// S&P 500 tickers for generating additional signals
const sp500Tickers = [
  'META', 'BRK.B', 'V', 'WMT', 'PG', 'JNJ', 'UNH', 'HD', 'MA', 'DIS', 'PYPL', 'BAC', 'XOM', 'ABBV', 'CVX', 'PFE', 'KO', 'PEP', 'TMO', 'COST',
  'MRK', 'ABT', 'VZ', 'ACN', 'ADBE', 'NFLX', 'DHR', 'TXN', 'NKE', 'CMCSA', 'CRM', 'AVGO', 'WFC', 'ORCL', 'AMD', 'INTC', 'QCOM', 'IBM', 'NOW', 'GE',
  'T', 'AMGN', 'HON', 'SBUX', 'ISRG', 'BKNG', 'AMAT', 'INTU', 'GILD', 'SPGI', 'MDT', 'LOW', 'CAT', 'AXP', 'SYK', 'BLK', 'ADP', 'TJX', 'PLD', 'CI',
  'SO', 'TGT', 'DE', 'DUK', 'NEE', 'BSX', 'ICE', 'SPG', 'AON', 'MMM', 'FISV', 'ITW', 'RTX', 'NSC', 'EW', 'PNC', 'CL', 'ZTS', 'ETN', 'EMR',
  'GD', 'APD', 'ECL', 'EA', 'CCI', 'SHW', 'D', 'BA', 'FDX', 'AEP', 'OXY', 'PSA', 'PGR', 'NOC', 'A', 'COF', 'CME', 'WBA', 'MRNA', 'VLO',
  'AFL', 'KMB', 'SYY', 'F', 'GM', 'EL', 'HLT', 'EXC', 'TEL', 'AOS', 'FTNT', 'ROP', 'ES', 'YUM', 'CNC', 'ILMN', 'KLAC', 'ROKU', 'CTAS', 'CHTR',
  'VRTX', 'IDXX', 'ALGN', 'ZBRA', 'CDNS', 'MCHP', 'CPRT', 'PAYX', 'FAST', 'TTWO', 'WYNN', 'WLTW', 'CTSH', 'CBOE', 'BIIB', 'INCY', 'LRCX', 'AMCR', 'NTRS', 'ANSS',
  'POOL', 'MKTX', 'DXCM', 'ETSY', 'FANG', 'GPN', 'KEYS', 'LUV', 'MSCI', 'OKTA', 'QRVO', 'REGN', 'ROST', 'SNPS', 'SWKS', 'TSCO', 'VRSK', 'WST', 'XEL', 'ZEN'
];

// Function to generate a signal for a ticker
function generateSignal(ticker: string, index: number): Signal {
  const sectors = ['Technology', 'Healthcare', 'Financials', 'Consumer', 'Industrials', 'Energy', 'Utilities', 'Real Estate', 'Materials', 'Communication', 'Consumer Defensive'];
  const authors: AuthorType[] = ['Lynch', "O'Neil", 'Graham'];
  // const signals: ('BUY' | 'HOLD' | 'SELL')[] = ['BUY', 'HOLD', 'SELL']; // Not used, generating dynamically
  const riskProfiles: RiskProfile[] = ['Conservative', 'Moderate', 'Aggressive'];
  const industries = ['Software', 'Banks', 'Pharmaceuticals', 'Retail', 'Manufacturing', 'Oil & Gas', 'Electric', 'REITs', 'Mining', 'Media', 'Food'];
  
  // Generate realistic values
  const isBuy = Math.random() < 0.6; // 60% buy signals
  const isHold = Math.random() < 0.8; // 20% hold signals
  const signal = isBuy ? 'BUY' : isHold ? 'HOLD' : 'SELL';
  
  const basePrice = 50 + Math.random() * 450; // $50-$500
  const changePct = signal === 'BUY' ? (Math.random() * 5) : signal === 'HOLD' ? (Math.random() * 2 - 1) : -(Math.random() * 5);
  
  const lynchScore = 40 + Math.random() * 60;
  const oneilScore = 40 + Math.random() * 60;
  const grahamScore = 40 + Math.random() * 60;
  const trinityScore = (lynchScore + oneilScore + grahamScore) / 3;
  
  const pe = 10 + Math.random() * 40;
  const peg = 0.5 + Math.random() * 3;
  const pb = 1 + Math.random() * 10;
  const roe = 5 + Math.random() * 35;
  const debtEquity = Math.random() * 1.5;
  const currentRatio = 0.5 + Math.random() * 3;
  const revenueGrowth = -10 + Math.random() * 50;
  const epsGrowth = -15 + Math.random() * 60;
  const profitMargin = 5 + Math.random() * 30;
  
  const relativeStrength = 30 + Math.random() * 70;
  const priceVs52High = 0.5 + Math.random() * 0.5;
  const volume = 1000000 + Math.random() * 100000000;
  const volumeRatio = 0.5 + Math.random() * 3;
  
  const marketCap = 1000000000 + Math.random() * 2000000000000; // $1B to $2T
  
  const sector = sectors[index % sectors.length];
  const author = authors[index % authors.length];
  const riskProfile = riskProfiles[index % riskProfiles.length];
  const industry = industries[index % industries.length];
  
  const confidence = 50 + Math.random() * 50;
  
  // Generate entry price, target, and stop loss
  const entryPrice = basePrice;
  const targetPrice = signal === 'BUY' ? entryPrice * (1.1 + Math.random() * 0.3) : 
                     signal === 'HOLD' ? entryPrice * (1.02 + Math.random() * 0.1) :
                     entryPrice * (0.85 + Math.random() * 0.1);
  const stopLoss = signal === 'BUY' ? entryPrice * (0.85 + Math.random() * 0.1) :
                   signal === 'HOLD' ? entryPrice * (0.92 + Math.random() * 0.05) :
                   entryPrice * (1.05 + Math.random() * 0.1);
  
  const expectedReturn = ((targetPrice - entryPrice) / entryPrice) * 100;
  const holdingPeriod = 30 + Math.random() * 335; // 30-365 days
  
  return {
    id: `SIG-${String(index + 21).padStart(3, '0')}`,
    ticker,
    companyName: `${ticker} Corporation`,
    date: "2025-10-15",
    signal,
    price: Math.round(basePrice * 100) / 100,
    changePct: Math.round(changePct * 100) / 100,
    
    // Trinity Scores
    lynchScore: Math.round(lynchScore),
    oneilScore: Math.round(oneilScore),
    grahamScore: Math.round(grahamScore),
    trinityScore: Math.round(trinityScore * 10) / 10,
    
    // Metadatos
    author: author,
    criteria: [`P/E < ${Math.round(pe * 1.2)}`, `Revenue Growth > ${Math.round(revenueGrowth * 0.8)}%`, 'Strong Fundamentals'],
    confidence: Math.round(confidence),
    rationale: `Company with ${signal === 'BUY' ? 'strong' : signal === 'HOLD' ? 'stable' : 'challenging'} fundamentals and ${sector.toLowerCase()} sector exposure`,
    
    // Trading
    entryPrice: Math.round(entryPrice * 100) / 100,
    targetPrice: Math.round(targetPrice * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    expectedReturn: Math.round(expectedReturn * 100) / 100,
    holdingPeriod: Math.round(holdingPeriod),
    
    // Fundamentales
    pe: Math.round(pe * 10) / 10,
    peg: Math.round(peg * 100) / 100,
    pb: Math.round(pb * 10) / 10,
    roe: Math.round(roe * 10) / 10,
    debtEquity: Math.round(debtEquity * 100) / 100,
    currentRatio: Math.round(currentRatio * 10) / 10,
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    epsGrowth: Math.round(epsGrowth * 10) / 10,
    profitMargin: Math.round(profitMargin * 10) / 10,
    
    // Técnicos
    relativeStrength: Math.round(relativeStrength),
    priceVs52High: Math.round(priceVs52High * 100) / 100,
    volume: Math.round(volume),
    volumeRatio: Math.round(volumeRatio * 100) / 100,
    
    // Clasificación
    sector,
    industry,
    marketCap: Math.round(marketCap),
    riskProfile: riskProfile
  };
}

// Generate additional signals
export const additionalSignals: Signal[] = sp500Tickers.slice(0, 480).map((ticker, index) => generateSignal(ticker, index));
