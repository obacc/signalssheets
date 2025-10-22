// ============================================
// ARCHIVO COMPLETO: src/types/index.ts
// Versión: 2.0 - TRINITY METHOD COMPLETE
// INSTRUCCIÓN: Reemplazar TODO el contenido
// ============================================

// ============================================
// TIPOS DE SEÑALES Y AUTORES
// ============================================
export type SignalType = 'BUY' | 'SELL' | 'HOLD';
export type AuthorType = 'Lynch' | 'O\'Neil' | 'Graham';
export type MarketCondition = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
export type RiskProfile = 'Conservative' | 'Moderate' | 'Aggressive';

// ============================================
// AUTENTICACIÓN
// ============================================
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'pro' | 'free';
  createdAt: string;
  subscription?: {
    plan: 'free' | 'pro' | 'premium';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt?: string;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
}

// ============================================
// SEÑALES TRINITY METHOD
// ============================================
export interface Signal {
  // Identificación
  id: string;
  ticker: string;
  companyName: string;
  
  // Señal y Scoring
  signal: SignalType;
  strength: number;
  dominantAuthor: AuthorType;
  confidence: number;
  
  // Precios y Targets
  price: number;
  change: number;
  targetPrice?: number;
  stopLoss?: number;
  
  // Trinity Scores
  trinityScores: {
    lynch: number;
    oneil: number;
    graham: number;
  };
  
  // Metadata
  sector: string;
  riskProfile: RiskProfile;
  
  // Timestamps
  signalDate: string;
  lastUpdated: string;
  
  // Análisis
  reasoning: string;
  fundamentals: {
    marketCap: string;
    pe: number;
    eps: number;
    dividend: number;
    volume: number;
  };
}

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================
export interface SignalFilters {
  search?: string;
  signalType?: SignalType | 'ALL';
  author?: AuthorType | 'ALL';
  sector?: string;
  riskProfile?: RiskProfile | 'ALL';
  minScore?: number;
  maxScore?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// ============================================
// MARKET REGIME INDICATOR
// ============================================
export interface MarketRegimeData {
  date: string;
  vix: number;
  put_call_ratio: number;
  high_low_index: number;
  advance_decline: number;
  overall_regime: MarketCondition;
  regime_strength: number;
  recommendation: string;
  indicators: {
    vix_signal: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
    pcr_signal: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
    hli_signal: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
    ad_signal: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  };
  trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
}

export interface MarketRegimeHistory {
  data: MarketRegimeData[];
  average_regime_score: number;
  trend_direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  volatility_level: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME';
}

// ============================================
// PORTFOLIO Y POSICIONES
// ============================================
export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  total_value: number;
  cash_balance: number;
  positions: Position[];
  performance: PerformanceMetrics;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  portfolio_id: string;
  ticker: string;
  quantity: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  realized_pnl?: number;
  opened_at: string;
  closed_at?: string;
  signal_id?: string;
  author?: AuthorType;
}

// ============================================
// MÉTRICAS Y PERFORMANCE
// ============================================
export interface PerformanceMetrics {
  total_return: number;
  total_return_percent: number;
  daily_change: number;
  daily_change_percent: number;
  weekly_change: number;
  monthly_change: number;
  yearly_change: number;
  sharpe_ratio?: number;
  win_rate?: number;
  avg_win?: number;
  avg_loss?: number;
  best_performer?: {
    ticker: string;
    return_percent: number;
  };
  worst_performer?: {
    ticker: string;
    return_percent: number;
  };
}

export interface SignalStats {
  total_signals: number;
  buy_signals: number;
  sell_signals: number;
  hold_signals: number;
  avg_trinity_score: number;
  success_rate: number;
  avg_return: number;
  by_author: {
    [key in AuthorType]: {
      count: number;
      avg_score: number;
      success_rate: number;
    };
  };
  by_sector: {
    [key: string]: {
      count: number;
      avg_return: number;
    };
  };
}

// ============================================
// PLANES Y SUSCRIPCIONES
// ============================================
export interface Plan {
  id: 'free' | 'pro' | 'premium';
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  limits: {
    signals_per_day?: number;
    watchlist_size?: number;
    portfolio_tracking?: boolean;
    real_time_alerts?: boolean;
    api_access?: boolean;
    priority_support?: boolean;
  };
}

// ============================================
// API RESPONSES
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// WATCHLIST
// ============================================
export interface WatchlistItem {
  ticker: string;
  addedAt: string;
  notes?: string;
  alertPrice?: number;
  alertType?: 'ABOVE' | 'BELOW';
}

export interface WatchlistState {
  items: WatchlistItem[];
  isLoading: boolean;
  addToWatchlist: (ticker: string) => void;
  removeFromWatchlist: (ticker: string) => void;
  isInWatchlist: (ticker: string) => boolean;
  clearWatchlist: () => void;
  setAlertPrice: (ticker: string, price: number, type: 'ABOVE' | 'BELOW') => void;
  loadWatchlist: () => void;
}

// ============================================
// NOTIFICACIONES Y ALERTAS
// ============================================
export interface Notification {
  id: string;
  type: 'signal' | 'alert' | 'news' | 'system';
  title: string;
  message: string;
  ticker?: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  created_at: string;
  action_url?: string;
}

// ============================================
// CONFIGURACIÓN DE USUARIO
// ============================================
export interface UserSettings {
  user_id: string;
  notifications: {
    email_alerts: boolean;
    push_alerts: boolean;
    signal_alerts: boolean;
    price_alerts: boolean;
    news_alerts: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'auto';
    language: 'en' | 'es';
    currency: 'USD' | 'EUR' | 'GBP';
    timezone: string;
  };
  trading: {
    default_position_size?: number;
    risk_per_trade?: number;
    preferred_authors?: AuthorType[];
    excluded_sectors?: string[];
  };
}

// ============================================
// EXPORT TYPE GUARDS
// ============================================
export const isSignal = (obj: any): obj is Signal => {
  return obj && typeof obj.ticker === 'string' && typeof obj.trinity_score === 'number';
};

export const isMarketRegimeData = (obj: any): obj is MarketRegimeData => {
  return obj && typeof obj.vix === 'number' && typeof obj.overall_regime === 'string';
};