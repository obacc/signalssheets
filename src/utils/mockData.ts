import type { Signal } from '../types'

export const mockSignals: Signal[] = [
  // ============================================
  // SEÑALES EXISTENTES (5)
  // ============================================
  {
    id: "SIG-001",
    ticker: "AAPL",
    companyName: "Apple Inc.",
    date: "2025-10-15",
    signal: "BUY",
    price: 178.50,
    changePct: 2.3,
    
    // Trinity Scores
    lynchScore: 85,
    oneilScore: 78,
    grahamScore: 72,
    trinityScore: 78.3,
    
    // Metadatos
    author: "Lynch",
    criteria: ["PEG < 1", "Revenue Growth > 20%", "Strong Balance Sheet"],
    confidence: 85,
    rationale: "Empresa con crecimiento sólido, PEG atractivo y fundamentales fuertes",
    
    // Trading
    entryPrice: 178.50,
    targetPrice: 205.00,
    stopLoss: 165.00,
    expectedReturn: 14.8,
    holdingPeriod: 180,
    
    // Fundamentales
    pe: 28.5,
    peg: 0.95,
    pb: 6.2,
    roe: 22.1,
    debtEquity: 0.15,
    currentRatio: 1.8,
    revenueGrowth: 23.5,
    epsGrowth: 18.2,
    profitMargin: 25.8,
    
    // Técnicos
    relativeStrength: 78,
    priceVs52High: 0.85,
    volume: 45000000,
    volumeRatio: 1.2,
    
    // Clasificación
    sector: "Technology",
    industry: "Consumer Electronics",
    marketCap: 2800000000000,
    riskProfile: "Moderate"
  },
  {
    id: "SIG-002",
    ticker: "MSFT",
    companyName: "Microsoft Corporation",
    date: "2025-10-15",
    signal: "BUY",
    price: 401.30,
    changePct: -0.5,
    
    // Trinity Scores
    lynchScore: 79,
    oneilScore: 82,
    grahamScore: 75,
    trinityScore: 78.7,
    
    // Metadatos
    author: "O'Neil",
    criteria: ["RS Rating > 80", "Earnings Growth > 25%", "Volume Surge"],
    confidence: 82,
    rationale: "Breakout técnico con volumen fuerte y earnings sólidos",
    
    // Trading
    entryPrice: 401.30,
    targetPrice: 450.00,
    stopLoss: 375.00,
    expectedReturn: 12.1,
    holdingPeriod: 120,
    
    // Fundamentales
    pe: 32.1,
    peg: 1.1,
    pb: 12.8,
    roe: 39.2,
    debtEquity: 0.25,
    currentRatio: 2.1,
    revenueGrowth: 28.7,
    epsGrowth: 32.1,
    profitMargin: 35.2,
    
    // Técnicos
    relativeStrength: 85,
    priceVs52High: 0.92,
    volume: 32000000,
    volumeRatio: 1.8,
    
    // Clasificación
    sector: "Technology",
    industry: "Software",
    marketCap: 3000000000000,
    riskProfile: "Moderate"
  },
  {
    id: "SIG-003",
    ticker: "KO",
    companyName: "The Coca-Cola Company",
    date: "2025-10-15",
    signal: "HOLD",
    price: 61.80,
    changePct: 0.3,
    
    // Trinity Scores
    lynchScore: 65,
    oneilScore: 45,
    grahamScore: 88,
    trinityScore: 66.0,
    
    // Metadatos
    author: "Graham",
    criteria: ["P/E < 20", "Debt/Equity < 0.5", "Dividend Yield > 3%"],
    confidence: 75,
    rationale: "Valor defensivo con balance sólido y dividendos estables",
    
    // Trading
    entryPrice: 61.80,
    targetPrice: 68.00,
    stopLoss: 58.00,
    expectedReturn: 10.0,
    holdingPeriod: 365,
    
    // Fundamentales
    pe: 18.5,
    peg: 2.1,
    pb: 4.2,
    roe: 22.8,
    debtEquity: 0.35,
    currentRatio: 1.2,
    revenueGrowth: 8.5,
    epsGrowth: 6.2,
    profitMargin: 18.5,
    
    // Técnicos
    relativeStrength: 45,
    priceVs52High: 0.78,
    volume: 12000000,
    volumeRatio: 0.8,
    
    // Clasificación
    sector: "Consumer Defensive",
    industry: "Beverages",
    marketCap: 270000000000,
    riskProfile: "Conservative"
  },
  {
    id: "SIG-004",
    ticker: "NVDA",
    companyName: "NVIDIA Corporation",
    date: "2025-10-15",
    signal: "BUY",
    price: 425.60,
    changePct: 4.2,
    
    // Trinity Scores
    lynchScore: 92,
    oneilScore: 95,
    grahamScore: 68,
    trinityScore: 85.0,
    
    // Metadatos
    author: "Lynch",
    criteria: ["PEG < 0.8", "Revenue Growth > 50%", "Market Leadership"],
    confidence: 92,
    rationale: "Líder en AI con crecimiento explosivo y PEG excepcional",
    
    // Trading
    entryPrice: 425.60,
    targetPrice: 520.00,
    stopLoss: 390.00,
    expectedReturn: 22.2,
    holdingPeriod: 90,
    
    // Fundamentales
    pe: 45.2,
    peg: 0.75,
    pb: 18.5,
    roe: 41.2,
    debtEquity: 0.12,
    currentRatio: 3.2,
    revenueGrowth: 58.3,
    epsGrowth: 65.1,
    profitMargin: 28.5,
    
    // Técnicos
    relativeStrength: 95,
    priceVs52High: 0.88,
    volume: 55000000,
    volumeRatio: 2.1,
    
    // Clasificación
    sector: "Technology",
    industry: "Semiconductors",
    marketCap: 1050000000000,
    riskProfile: "Aggressive"
  },
  {
    id: "SIG-005",
    ticker: "JNJ",
    companyName: "Johnson & Johnson",
    date: "2025-10-15",
    signal: "BUY",
    price: 158.40,
    changePct: 1.1,
    
    // Trinity Scores
    lynchScore: 72,
    oneilScore: 58,
    grahamScore: 91,
    trinityScore: 73.7,
    
    // Metadatos
    author: "Graham",
    criteria: ["P/E < 15", "AAA Credit Rating", "Dividend Aristocrat"],
    confidence: 88,
    rationale: "Blue chip defensivo con dividendos crecientes y balance AAA",
    
    // Trading
    entryPrice: 158.40,
    targetPrice: 175.00,
    stopLoss: 145.00,
    expectedReturn: 10.5,
    holdingPeriod: 300,
    
    // Fundamentales
    pe: 14.2,
    peg: 1.8,
    pb: 3.8,
    roe: 26.8,
    debtEquity: 0.18,
    currentRatio: 1.5,
    revenueGrowth: 6.8,
    epsGrowth: 8.2,
    profitMargin: 22.1,
    
    // Técnicos
    relativeStrength: 58,
    priceVs52High: 0.82,
    volume: 8500000,
    volumeRatio: 1.1,
    
    // Clasificación
    sector: "Healthcare",
    industry: "Pharmaceuticals",
    marketCap: 420000000000,
    riskProfile: "Conservative"
  },

  // ============================================
  // NUEVAS SEÑALES (15) - DIVERSIFICADAS
  // ============================================

  // FINANCIALS SECTOR
  {
    id: "SIG-006",
    ticker: "JPM",
    companyName: "JPMorgan Chase & Co.",
    date: "2025-10-15",
    signal: "BUY",
    price: 185.20,
    changePct: 1.8,
    
    // Trinity Scores
    lynchScore: 78,
    oneilScore: 72,
    grahamScore: 85,
    trinityScore: 78.3,
    
    // Metadatos
    author: "Graham",
    criteria: ["P/E < 12", "Strong Capital Ratios", "Dividend Growth"],
    confidence: 82,
    rationale: "Banco líder con ratios sólidos y dividendos crecientes",
    
    // Trading
    entryPrice: 185.20,
    targetPrice: 210.00,
    stopLoss: 170.00,
    expectedReturn: 13.4,
    holdingPeriod: 240,
    
    // Fundamentales
    pe: 11.8,
    peg: 1.2,
    pb: 1.6,
    roe: 13.5,
    debtEquity: 0.8,
    currentRatio: 0.9,
    revenueGrowth: 12.3,
    epsGrowth: 15.2,
    profitMargin: 28.5,
    
    // Técnicos
    relativeStrength: 72,
    priceVs52High: 0.89,
    volume: 12000000,
    volumeRatio: 1.3,
    
    // Clasificación
    sector: "Financials",
    industry: "Banks",
    marketCap: 550000000000,
    riskProfile: "Moderate"
  },

  // COMMUNICATION SERVICES SECTOR
  {
    id: "SIG-007",
    ticker: "GOOGL",
    companyName: "Alphabet Inc.",
    date: "2025-10-15",
    signal: "BUY",
    price: 142.80,
    changePct: 3.1,
    
    // Trinity Scores
    lynchScore: 88,
    oneilScore: 85,
    grahamScore: 65,
    trinityScore: 79.3,
    
    // Metadatos
    author: "Lynch",
    criteria: ["PEG < 1.2", "Revenue Growth > 15%", "Market Leadership"],
    confidence: 85,
    rationale: "Líder en búsqueda y AI con crecimiento sostenido",
    
    // Trading
    entryPrice: 142.80,
    targetPrice: 165.00,
    stopLoss: 130.00,
    expectedReturn: 15.5,
    holdingPeriod: 180,
    
    // Fundamentales
    pe: 24.5,
    peg: 1.1,
    pb: 4.8,
    roe: 19.6,
    debtEquity: 0.12,
    currentRatio: 2.8,
    revenueGrowth: 18.2,
    epsGrowth: 22.1,
    profitMargin: 21.8,
    
    // Técnicos
    relativeStrength: 85,
    priceVs52High: 0.91,
    volume: 28000000,
    volumeRatio: 1.6,
    
    // Clasificación
    sector: "Communication Services",
    industry: "Internet Content",
    marketCap: 1800000000000,
    riskProfile: "Moderate"
  },

  // CONSUMER CYCLICAL SECTOR
  {
    id: "SIG-008",
    ticker: "AMZN",
    companyName: "Amazon.com Inc.",
    date: "2025-10-15",
    signal: "BUY",
    price: 155.40,
    changePct: 2.7,
    
    // Trinity Scores
    lynchScore: 82,
    oneilScore: 78,
    grahamScore: 70,
    trinityScore: 76.7,
    
    // Metadatos
    author: "Lynch",
    criteria: ["Revenue Growth > 20%", "Market Expansion", "AWS Growth"],
    confidence: 80,
    rationale: "E-commerce líder con AWS creciendo exponencialmente",
    
    // Trading
    entryPrice: 155.40,
    targetPrice: 180.00,
    stopLoss: 140.00,
    expectedReturn: 15.8,
    holdingPeriod: 200,
    
    // Fundamentales
    pe: 35.2,
    peg: 1.4,
    pb: 6.8,
    roe: 19.3,
    debtEquity: 0.25,
    currentRatio: 1.1,
    revenueGrowth: 25.8,
    epsGrowth: 28.5,
    profitMargin: 5.2,
    
    // Técnicos
    relativeStrength: 78,
    priceVs52High: 0.87,
    volume: 35000000,
    volumeRatio: 1.4,
    
    // Clasificación
    sector: "Consumer Cyclical",
    industry: "E-commerce",
    marketCap: 1600000000000,
    riskProfile: "Moderate"
  },

  // INDUSTRIALS SECTOR
  {
    id: "SIG-009",
    ticker: "CAT",
    companyName: "Caterpillar Inc.",
    date: "2025-10-15",
    signal: "HOLD",
    price: 285.60,
    changePct: -1.2,
    
    // Trinity Scores
    lynchScore: 68,
    oneilScore: 62,
    grahamScore: 75,
    trinityScore: 68.3,
    
    // Metadatos
    author: "Graham",
    criteria: ["P/E < 18", "Strong Balance Sheet", "Dividend Yield"],
    confidence: 70,
    rationale: "Ciclo económico maduro, valoración conservadora",
    
    // Trading
    entryPrice: 285.60,
    targetPrice: 310.00,
    stopLoss: 265.00,
    expectedReturn: 8.5,
    holdingPeriod: 300,
    
    // Fundamentales
    pe: 16.8,
    peg: 1.9,
    pb: 4.2,
    roe: 25.1,
    debtEquity: 0.45,
    currentRatio: 1.3,
    revenueGrowth: 8.2,
    epsGrowth: 9.8,
    profitMargin: 12.8,
    
    // Técnicos
    relativeStrength: 62,
    priceVs52High: 0.76,
    volume: 2800000,
    volumeRatio: 0.9,
    
    // Clasificación
    sector: "Industrials",
    industry: "Heavy Machinery",
    marketCap: 150000000000,
    riskProfile: "Moderate"
  },

  // ENERGY SECTOR
  {
    id: "SIG-010",
    ticker: "XOM",
    companyName: "Exxon Mobil Corporation",
    date: "2025-10-15",
    signal: "HOLD",
    price: 118.40,
    changePct: 0.8,
    
    // Trinity Scores
    lynchScore: 55,
    oneilScore: 48,
    grahamScore: 72,
    trinityScore: 58.3,
    
    // Metadatos
    author: "Graham",
    criteria: ["Dividend Yield > 3%", "Asset Value", "Cash Flow"],
    confidence: 65,
    rationale: "Dividendos altos pero sector cíclico, precaución",
    
    // Trading
    entryPrice: 118.40,
    targetPrice: 125.00,
    stopLoss: 110.00,
    expectedReturn: 5.6,
    holdingPeriod: 365,
    
    // Fundamentales
    pe: 14.2,
    peg: 2.8,
    pb: 1.8,
    roe: 12.6,
    debtEquity: 0.22,
    currentRatio: 1.0,
    revenueGrowth: -5.2,
    epsGrowth: -8.1,
    profitMargin: 8.5,
    
    // Técnicos
    relativeStrength: 48,
    priceVs52High: 0.72,
    volume: 15000000,
    volumeRatio: 0.7,
    
    // Clasificación
    sector: "Energy",
    industry: "Oil & Gas",
    marketCap: 480000000000,
    riskProfile: "Conservative"
  },

  // UTILITIES SECTOR
  {
    id: "SIG-011",
    ticker: "NEE",
    companyName: "NextEra Energy Inc.",
    date: "2025-10-15",
    signal: "BUY",
    price: 78.20,
    changePct: 1.5,
    
    // Trinity Scores
    lynchScore: 75,
    oneilScore: 68,
    grahamScore: 88,
    trinityScore: 77.0,
    
    // Metadatos
    author: "Graham",
    criteria: ["Dividend Growth", "Renewable Leadership", "Regulated Assets"],
    confidence: 82,
    rationale: "Líder en energías renovables con dividendos crecientes",
    
    // Trading
    entryPrice: 78.20,
    targetPrice: 88.00,
    stopLoss: 72.00,
    expectedReturn: 12.5,
    holdingPeriod: 300,
    
    // Fundamentales
    pe: 18.5,
    peg: 1.6,
    pb: 2.8,
    roe: 15.2,
    debtEquity: 0.35,
    currentRatio: 0.8,
    revenueGrowth: 12.8,
    epsGrowth: 11.5,
    profitMargin: 18.2,
    
    // Técnicos
    relativeStrength: 68,
    priceVs52High: 0.85,
    volume: 4200000,
    volumeRatio: 1.2,
    
    // Clasificación
    sector: "Utilities",
    industry: "Electric Utilities",
    marketCap: 160000000000,
    riskProfile: "Conservative"
  },

  // REAL ESTATE SECTOR
  {
    id: "SIG-012",
    ticker: "PLD",
    companyName: "Prologis Inc.",
    date: "2025-10-15",
    signal: "BUY",
    price: 125.80,
    changePct: 2.1,
    
    // Trinity Scores
    lynchScore: 72,
    oneilScore: 75,
    grahamScore: 78,
    trinityScore: 75.0,
    
    // Metadatos
    author: "Graham",
    criteria: ["REIT Dividend", "Industrial REIT", "E-commerce Growth"],
    confidence: 78,
    rationale: "REIT industrial líder beneficiándose del e-commerce",
    
    // Trading
    entryPrice: 125.80,
    targetPrice: 145.00,
    stopLoss: 115.00,
    expectedReturn: 15.2,
    holdingPeriod: 240,
    
    // Fundamentales
    pe: 22.8,
    peg: 1.8,
    pb: 2.2,
    roe: 9.6,
    debtEquity: 0.28,
    currentRatio: 0.3,
    revenueGrowth: 15.2,
    epsGrowth: 12.8,
    profitMargin: 42.1,
    
    // Técnicos
    relativeStrength: 75,
    priceVs52High: 0.88,
    volume: 1800000,
    volumeRatio: 1.1,
    
    // Clasificación
    sector: "Real Estate",
    industry: "REITs",
    marketCap: 120000000000,
    riskProfile: "Moderate"
  },

  // BASIC MATERIALS SECTOR
  {
    id: "SIG-013",
    ticker: "LIN",
    companyName: "Linde plc",
    date: "2025-10-15",
    signal: "BUY",
    price: 445.60,
    changePct: 1.8,
    
    // Trinity Scores
    lynchScore: 80,
    oneilScore: 72,
    grahamScore: 85,
    trinityScore: 79.0,
    
    // Metadatos
    author: "Graham",
    criteria: ["Dividend Aristocrat", "Industrial Gases", "Green Transition"],
    confidence: 85,
    rationale: "Líder en gases industriales con exposición a transición verde",
    
    // Trading
    entryPrice: 445.60,
    targetPrice: 485.00,
    stopLoss: 420.00,
    expectedReturn: 8.8,
    holdingPeriod: 300,
    
    // Fundamentales
    pe: 28.5,
    peg: 1.4,
    pb: 3.8,
    roe: 13.3,
    debtEquity: 0.32,
    currentRatio: 1.2,
    revenueGrowth: 8.5,
    epsGrowth: 20.2,
    profitMargin: 15.8,
    
    // Técnicos
    relativeStrength: 72,
    priceVs52High: 0.92,
    volume: 1200000,
    volumeRatio: 1.0,
    
    // Clasificación
    sector: "Basic Materials",
    industry: "Industrial Gases",
    marketCap: 220000000000,
    riskProfile: "Moderate"
  },

  // FINANCIALS SECTOR - SELL SIGNAL
  {
    id: "SIG-014",
    ticker: "BAC",
    companyName: "Bank of America Corporation",
    date: "2025-10-15",
    signal: "SELL",
    price: 32.40,
    changePct: -2.8,
    
    // Trinity Scores
    lynchScore: 45,
    oneilScore: 38,
    grahamScore: 52,
    trinityScore: 45.0,
    
    // Metadatos
    author: "Graham",
    criteria: ["Interest Rate Risk", "Credit Concerns", "Regulatory Pressure"],
    confidence: 60,
    rationale: "Presión regulatoria y riesgos de tasas de interés",
    
    // Trading
    entryPrice: 32.40,
    targetPrice: 28.00,
    stopLoss: 35.00,
    expectedReturn: -13.6,
    holdingPeriod: 90,
    
    // Fundamentales
    pe: 12.5,
    peg: 2.2,
    pb: 1.2,
    roe: 9.6,
    debtEquity: 0.9,
    currentRatio: 0.8,
    revenueGrowth: -2.1,
    epsGrowth: -5.8,
    profitMargin: 22.5,
    
    // Técnicos
    relativeStrength: 38,
    priceVs52High: 0.65,
    volume: 45000000,
    volumeRatio: 1.8,
    
    // Clasificación
    sector: "Financials",
    industry: "Banks",
    marketCap: 260000000000,
    riskProfile: "Moderate"
  },

  // CONSUMER CYCLICAL SECTOR - AGGRESSIVE
  {
    id: "SIG-015",
    ticker: "TSLA",
    companyName: "Tesla Inc.",
    date: "2025-10-15",
    signal: "BUY",
    price: 245.80,
    changePct: 5.2,
    
    // Trinity Scores
    lynchScore: 85,
    oneilScore: 92,
    grahamScore: 45,
    trinityScore: 74.0,
    
    // Metadatos
    author: "O'Neil",
    criteria: ["High Growth", "Market Leadership", "Innovation"],
    confidence: 88,
    rationale: "Líder en EVs con crecimiento explosivo y momentum técnico",
    
    // Trading
    entryPrice: 245.80,
    targetPrice: 295.00,
    stopLoss: 220.00,
    expectedReturn: 20.0,
    holdingPeriod: 120,
    
    // Fundamentales
    pe: 65.2,
    peg: 2.8,
    pb: 12.5,
    roe: 19.2,
    debtEquity: 0.15,
    currentRatio: 1.8,
    revenueGrowth: 35.8,
    epsGrowth: 45.2,
    profitMargin: 8.5,
    
    // Técnicos
    relativeStrength: 92,
    priceVs52High: 0.95,
    volume: 85000000,
    volumeRatio: 2.5,
    
    // Clasificación
    sector: "Consumer Cyclical",
    industry: "Auto Manufacturers",
    marketCap: 780000000000,
    riskProfile: "Aggressive"
  },

  // HEALTHCARE SECTOR - BIOTECH
  {
    id: "SIG-016",
    ticker: "UNH",
    companyName: "UnitedHealth Group Inc.",
    date: "2025-10-15",
    signal: "BUY",
    price: 525.40,
    changePct: 1.2,
    
    // Trinity Scores
    lynchScore: 78,
    oneilScore: 72,
    grahamScore: 82,
    trinityScore: 77.3,
    
    // Metadatos
    author: "Graham",
    criteria: ["Dividend Growth", "Healthcare Leader", "Stable Business"],
    confidence: 80,
    rationale: "Líder en seguros de salud con dividendos crecientes",
    
    // Trading
    entryPrice: 525.40,
    targetPrice: 580.00,
    stopLoss: 490.00,
    expectedReturn: 10.4,
    holdingPeriod: 300,
    
    // Fundamentales
    pe: 24.8,
    peg: 1.6,
    pb: 5.2,
    roe: 21.0,
    debtEquity: 0.35,
    currentRatio: 1.1,
    revenueGrowth: 14.2,
    epsGrowth: 15.8,
    profitMargin: 6.2,
    
    // Técnicos
    relativeStrength: 72,
    priceVs52High: 0.88,
    volume: 3200000,
    volumeRatio: 1.0,
    
    // Clasificación
    sector: "Healthcare",
    industry: "Health Insurance",
    marketCap: 490000000000,
    riskProfile: "Moderate"
  },

  // COMMUNICATION SERVICES - SELL SIGNAL
  {
    id: "SIG-017",
    ticker: "NFLX",
    companyName: "Netflix Inc.",
    date: "2025-10-15",
    signal: "SELL",
    price: 485.20,
    changePct: -3.5,
    
    // Trinity Scores
    lynchScore: 42,
    oneilScore: 35,
    grahamScore: 48,
    trinityScore: 41.7,
    
    // Metadatos
    author: "Graham",
    criteria: ["High Valuation", "Competition", "Subscriber Pressure"],
    confidence: 55,
    rationale: "Competencia intensa y presión en suscriptores",
    
    // Trading
    entryPrice: 485.20,
    targetPrice: 420.00,
    stopLoss: 510.00,
    expectedReturn: -13.4,
    holdingPeriod: 90,
    
    // Fundamentales
    pe: 28.5,
    peg: 3.2,
    pb: 6.8,
    roe: 23.8,
    debtEquity: 0.45,
    currentRatio: 1.2,
    revenueGrowth: 8.5,
    epsGrowth: 9.2,
    profitMargin: 15.8,
    
    // Técnicos
    relativeStrength: 35,
    priceVs52High: 0.68,
    volume: 4200000,
    volumeRatio: 1.5,
    
    // Clasificación
    sector: "Communication Services",
    industry: "Streaming",
    marketCap: 210000000000,
    riskProfile: "Aggressive"
  },

  // INDUSTRIALS SECTOR - DEFENSE
  {
    id: "SIG-018",
    ticker: "LMT",
    companyName: "Lockheed Martin Corporation",
    date: "2025-10-15",
    signal: "HOLD",
    price: 445.60,
    changePct: 0.5,
    
    // Trinity Scores
    lynchScore: 65,
    oneilScore: 58,
    grahamScore: 78,
    trinityScore: 67.0,
    
    // Metadatos
    author: "Graham",
    criteria: ["Defense Contracts", "Dividend Yield", "Government Business"],
    confidence: 72,
    rationale: "Contratos de defensa estables pero crecimiento limitado",
    
    // Trading
    entryPrice: 445.60,
    targetPrice: 470.00,
    stopLoss: 420.00,
    expectedReturn: 5.5,
    holdingPeriod: 365,
    
    // Fundamentales
    pe: 16.8,
    peg: 2.1,
    pb: 8.2,
    roe: 48.8,
    debtEquity: 0.25,
    currentRatio: 1.4,
    revenueGrowth: 5.2,
    epsGrowth: 8.1,
    profitMargin: 8.8,
    
    // Técnicos
    relativeStrength: 58,
    priceVs52High: 0.82,
    volume: 1200000,
    volumeRatio: 0.8,
    
    // Clasificación
    sector: "Industrials",
    industry: "Defense",
    marketCap: 110000000000,
    riskProfile: "Conservative"
  },

  // UTILITIES SECTOR - SMALL CAP
  {
    id: "SIG-019",
    ticker: "DUK",
    companyName: "Duke Energy Corporation",
    date: "2025-10-15",
    signal: "HOLD",
    price: 95.40,
    changePct: 0.8,
    
    // Trinity Scores
    lynchScore: 62,
    oneilScore: 55,
    grahamScore: 85,
    trinityScore: 67.3,
    
    // Metadatos
    author: "Graham",
    criteria: ["Dividend Yield", "Regulated Utility", "Stable Cash Flow"],
    confidence: 75,
    rationale: "Utility regulada con dividendos estables",
    
    // Trading
    entryPrice: 95.40,
    targetPrice: 102.00,
    stopLoss: 88.00,
    expectedReturn: 6.9,
    holdingPeriod: 365,
    
    // Fundamentales
    pe: 18.2,
    peg: 2.8,
    pb: 1.6,
    roe: 8.8,
    debtEquity: 0.65,
    currentRatio: 0.6,
    revenueGrowth: 3.2,
    epsGrowth: 6.5,
    profitMargin: 12.8,
    
    // Técnicos
    relativeStrength: 55,
    priceVs52High: 0.78,
    volume: 2800000,
    volumeRatio: 0.9,
    
    // Clasificación
    sector: "Utilities",
    industry: "Electric Utilities",
    marketCap: 75000000000,
    riskProfile: "Conservative"
  },

  // TECHNOLOGY SECTOR - SMALL CAP
  {
    id: "SIG-020",
    ticker: "SNOW",
    companyName: "Snowflake Inc.",
    date: "2025-10-15",
    signal: "BUY",
    price: 185.60,
    changePct: 4.8,
    
    // Trinity Scores
    lynchScore: 88,
    oneilScore: 92,
    grahamScore: 35,
    trinityScore: 71.7,
    
    // Metadatos
    author: "O'Neil",
    criteria: ["High Growth", "Cloud Data", "Market Expansion"],
    confidence: 85,
    rationale: "Líder en data cloud con crecimiento explosivo",
    
    // Trading
    entryPrice: 185.60,
    targetPrice: 225.00,
    stopLoss: 165.00,
    expectedReturn: 21.2,
    holdingPeriod: 150,
    
    // Fundamentales
    pe: 85.2,
    peg: 1.8,
    pb: 8.5,
    roe: 10.0,
    debtEquity: 0.05,
    currentRatio: 4.2,
    revenueGrowth: 45.8,
    epsGrowth: 52.1,
    profitMargin: -8.5,
    
    // Técnicos
    relativeStrength: 92,
    priceVs52High: 0.92,
    volume: 8500000,
    volumeRatio: 2.2,
    
    // Clasificación
    sector: "Technology",
    industry: "Cloud Software",
    marketCap: 58000000000,
    riskProfile: "Aggressive"
  }
]
