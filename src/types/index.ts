// ============================================
// INDICIUM SIGNALS - TYPE DEFINITIONS
// Trinity Method: Lynch + O'Neil + Graham
// ============================================

export type SignalType = 'BUY' | 'SELL' | 'HOLD';
export type AuthorType = 'Lynch' | 'O\'Neil' | 'Graham';
export type RiskProfile = 'Conservative' | 'Moderate' | 'Aggressive';
export type MarketRegime = 'Bull' | 'Lateral' | 'Bear';

// ============================================
// SEÑAL DE TRADING EOD
// ============================================

export interface Signal {
  // Identificación
  id: string;
  ticker: string;
  companyName: string;
  date: string; // ISO format YYYY-MM-DD
  signal: SignalType;
  price: number;
  changePct: number; // Cambio % del día
  
  // Trinity Scores (0-100)
  lynchScore: number;
  oneilScore: number;
  grahamScore: number;
  trinityScore: number; // Score combinado final
  
  // Metadatos de la señal
  author: AuthorType; // Autor dominante
  criteria: string[]; // Criterios cumplidos
  confidence: number; // 0-100
  rationale: string; // Explicación
  
  // Parámetros de Trading
  entryPrice: number;
  targetPrice?: number;
  stopLoss?: number;
  expectedReturn?: number; // %
  holdingPeriod?: number; // días
  
  // Fundamentales
  pe?: number;
  peg?: number;
  pb?: number;
  roe?: number;
  debtEquity?: number;
  currentRatio?: number;
  revenueGrowth?: number;
  epsGrowth?: number;
  profitMargin?: number;
  
  // Técnicos
  relativeStrength?: number;
  priceVs52High?: number;
  volume?: number;
  volumeRatio?: number;
  
  // Clasificación
  sector: string;
  industry: string;
  marketCap?: number;
  riskProfile: RiskProfile;
}

// ============================================
// USUARIO Y AUTENTICACIÓN
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'Free' | 'Pro' | 'Premium';
  signalsLimit: number;
  createdAt: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  clearError: () => void;
}

// ============================================
// FILTROS
// ============================================

export interface SignalFilters {
  search: string;
  signal: SignalType | 'ALL';
  author: AuthorType | 'ALL';
  riskProfile: RiskProfile | 'ALL';
  sector: string | 'ALL';
  minTrinityScore: number;
  maxTrinityScore: number;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================
// RÉGIMEN DE MERCADO
// ============================================

export interface MarketRegimeData {
  regime: MarketRegime;
  vix: number;
  spyReturn: number;
  breadth: number;
  sma50vsSma200: boolean;
  confidence: number;
  lastUpdate: string;
  lynchWeight: number;
  oneilWeight: number;
  grahamWeight: number;
}

// ============================================
// PORTFOLIO
// ============================================

export interface Position {
  id: string;
  signalId: string;
  ticker: string;
  entryDate: string;
  entryPrice: number;
  shares: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  status: 'OPEN' | 'CLOSED';
  closeDate?: string;
  closePrice?: number;
}

export interface Portfolio {
  userId: string;
  positions: Position[];
  totalValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  winRate: number;
  lastUpdated: string;
}

// ============================================
// PLANES
// ============================================

export interface Plan {
  id: 'free' | 'pro' | 'premium';
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly';
  features: string[];
  signalsLimit: number;
  historicalData: boolean;
  alerts: boolean;
  apiAccess: boolean;
  priority: boolean;
}

// ============================================
// API
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// ESTADÍSTICAS
// ============================================

export interface SignalStats {
  totalSignals: number;
  buySignals: number;
  sellSignals: number;
  holdSignals: number;
  avgTrinityScore: number;
  topSector: string;
  topAuthor: AuthorType;
}

export interface PerformanceMetrics {
  period: '7d' | '30d' | '90d' | '1y' | 'all';
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgReturn: number;
  bestTrade: number;
  worstTrade: number;
  sharpeRatio?: number;
}
