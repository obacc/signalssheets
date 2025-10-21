import { useState } from 'react';
import { Download, ChevronDown, ChevronUp, TrendingUp, Star, ExternalLink } from 'lucide-react';
import { useWatchlistStore } from '../store/watchlistStore';

interface Top10Signal {
  rank: number;
  ticker: string;
  company: string;
  trinityScore: number;
  technicalScore: number;
  signal: 'BUY' | 'HOLD' | 'SELL';
  sector: string;
  price: number;
  targetPrice: number;
  stopLoss: number;
  volume: number;
  rsi: number;
  macdSignal: 'bullish' | 'bearish' | 'neutral';
  reason: string;
  dominantAuthor: 'Lynch' | 'ONeil' | 'Graham';
  strength: number;
}

// Mock data - En producción vendría de API
const mockDailyTop10: Top10Signal[] = [
  {
    rank: 1,
    ticker: 'NVDA',
    company: 'NVIDIA Corporation',
    trinityScore: 95,
    technicalScore: 92,
    signal: 'BUY',
    sector: 'Technology',
    price: 485.50,
    targetPrice: 550.00,
    stopLoss: 460.00,
    volume: 52000000,
    rsi: 65,
    macdSignal: 'bullish',
    reason: 'Fuerte momentum en AI chips, earnings beat esperado, institucionales acumulando',
    dominantAuthor: 'ONeil',
    strength: 95
  },
  {
    rank: 2,
    ticker: 'MSFT',
    company: 'Microsoft Corporation',
    trinityScore: 92,
    technicalScore: 88,
    signal: 'BUY',
    sector: 'Technology',
    price: 420.25,
    targetPrice: 465.00,
    stopLoss: 400.00,
    volume: 28000000,
    rsi: 62,
    macdSignal: 'bullish',
    reason: 'Cloud Azure en crecimiento, ROE >20%, PEG ratio atractivo',
    dominantAuthor: 'Lynch',
    strength: 90
  },
  {
    rank: 3,
    ticker: 'META',
    company: 'Meta Platforms Inc',
    trinityScore: 90,
    technicalScore: 87,
    signal: 'BUY',
    sector: 'Technology',
    price: 485.00,
    targetPrice: 525.00,
    stopLoss: 465.00,
    volume: 18000000,
    rsi: 68,
    macdSignal: 'bullish',
    reason: 'Recuperación post-metaverse, AI monetization iniciando, valuación razonable',
    dominantAuthor: 'Lynch',
    strength: 88
  },
  {
    rank: 4,
    ticker: 'AMD',
    company: 'Advanced Micro Devices',
    trinityScore: 88,
    technicalScore: 85,
    signal: 'BUY',
    sector: 'Technology',
    price: 145.75,
    targetPrice: 170.00,
    stopLoss: 135.00,
    volume: 45000000,
    rsi: 61,
    macdSignal: 'bullish',
    reason: 'Competencia directa con NVDA en AI, market share ganando, técnicamente fuerte',
    dominantAuthor: 'ONeil',
    strength: 85
  },
  {
    rank: 5,
    ticker: 'GOOGL',
    company: 'Alphabet Inc Class A',
    trinityScore: 86,
    technicalScore: 82,
    signal: 'BUY',
    sector: 'Technology',
    price: 162.50,
    targetPrice: 185.00,
    stopLoss: 155.00,
    volume: 21000000,
    rsi: 59,
    macdSignal: 'neutral',
    reason: 'Valuación atractiva vs peers, Gemini AI mejorando, advertising recovering',
    dominantAuthor: 'Graham',
    strength: 82
  },
  {
    rank: 6,
    ticker: 'TSLA',
    company: 'Tesla Inc',
    trinityScore: 84,
    technicalScore: 88,
    signal: 'BUY',
    sector: 'Consumer',
    price: 250.00,
    targetPrice: 285.00,
    stopLoss: 235.00,
    volume: 95000000,
    rsi: 70,
    macdSignal: 'bullish',
    reason: 'FSD progress acelerando, Cybertruck ramping, volumen institucional alto',
    dominantAuthor: 'ONeil',
    strength: 90
  },
  {
    rank: 7,
    ticker: 'AVGO',
    company: 'Broadcom Inc',
    trinityScore: 83,
    technicalScore: 80,
    signal: 'BUY',
    sector: 'Technology',
    price: 875.00,
    targetPrice: 950.00,
    stopLoss: 840.00,
    volume: 2500000,
    rsi: 63,
    macdSignal: 'bullish',
    reason: 'AI networking chips demanda fuerte, dividend growth, margins expanding',
    dominantAuthor: 'Lynch',
    strength: 81
  },
  {
    rank: 8,
    ticker: 'ORCL',
    company: 'Oracle Corporation',
    trinityScore: 81,
    technicalScore: 78,
    signal: 'BUY',
    sector: 'Technology',
    price: 125.50,
    targetPrice: 140.00,
    stopLoss: 118.00,
    volume: 8500000,
    rsi: 58,
    macdSignal: 'neutral',
    reason: 'Cloud database líder, AI workloads creciendo, stable cash flow',
    dominantAuthor: 'Graham',
    strength: 78
  },
  {
    rank: 9,
    ticker: 'NOW',
    company: 'ServiceNow Inc',
    trinityScore: 80,
    technicalScore: 82,
    signal: 'BUY',
    sector: 'Technology',
    price: 765.00,
    targetPrice: 850.00,
    stopLoss: 730.00,
    volume: 1800000,
    rsi: 64,
    macdSignal: 'bullish',
    reason: 'Enterprise AI platform líder, subscription recurring revenue, high retention',
    dominantAuthor: 'Lynch',
    strength: 83
  },
  {
    rank: 10,
    ticker: 'PLTR',
    company: 'Palantir Technologies',
    trinityScore: 79,
    technicalScore: 85,
    signal: 'BUY',
    sector: 'Technology',
    price: 38.50,
    targetPrice: 45.00,
    stopLoss: 35.00,
    volume: 42000000,
    rsi: 72,
    macdSignal: 'bullish',
    reason: 'AI commercial contracts acelerando, government stable, technically overbought pero trending',
    dominantAuthor: 'ONeil',
    strength: 87
  },
];

export default function DailyTop10() {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const { addTicker, removeTicker, isFavorite } = useWatchlistStore();

  const toggleExpand = (rank: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(rank)) {
        next.delete(rank);
      } else {
        next.add(rank);
      }
      return next;
    });
  };

  const handleExportAll = () => {
    const csv = [
      ['Rank', 'Ticker', 'Company', 'Trinity Score', 'Technical Score', 'Signal', 'Sector', 'Price', 'Target', 'Stop Loss', 'Reason'],
      ...mockDailyTop10.map(s => [
        s.rank,
        s.ticker,
        s.company,
        s.trinityScore,
        s.technicalScore,
        s.signal,
        s.sector,
        s.price,
        s.targetPrice,
        s.stopLoss,
        s.reason.replace(/,/g, ';')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_top10_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportSingle = (signal: Top10Signal) => {
    const csv = [
      ['Rank', 'Ticker', 'Company', 'Trinity Score', 'Technical Score', 'Signal', 'Sector', 'Price', 'Target', 'Stop Loss', 'Reason'],
      [
        signal.rank,
        signal.ticker,
        signal.company,
        signal.trinityScore,
        signal.technicalScore,
        signal.signal,
        signal.sector,
        signal.price,
        signal.targetPrice,
        signal.stopLoss,
        signal.reason.replace(/,/g, ';')
      ]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${signal.ticker}_daily_top10_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'text-green-600 bg-green-50 border-green-200';
      case 'SELL': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getAuthorColor = (author: string) => {
    switch (author) {
      case 'Lynch': return 'text-blue-600 bg-blue-50';
      case 'ONeil': return 'text-purple-600 bg-purple-50';
      case 'Graham': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getMacdColor = (macd: string) => {
    switch (macd) {
      case 'bullish': return 'text-green-600 bg-green-50';
      case 'bearish': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🔥 Daily TOP 10</h1>
            <p className="text-gray-600">
              Las 10 mejores oportunidades del día - {new Date().toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('cards')} 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Cards
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Table
              </button>
            </div>
            
            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-4 h-4" />
              Exportar Todo
            </button>
          </div>
        </div>

        {/* Cards View */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockDailyTop10.map((signal) => {
              const isExpanded = expandedCards.has(signal.rank);
              const isStarred = isFavorite(signal.ticker);
              
              return (
                <div 
                  key={signal.rank}
                  className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 ${
                    signal.rank <= 3 
                      ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-white' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          signal.rank <= 3 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}>
                          {signal.rank}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{signal.ticker}</h3>
                          <p className="text-sm text-gray-600">{signal.company}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            isStarred ? removeTicker(signal.ticker) : addTicker(signal.ticker);
                          }}
                          className="transition hover:scale-110"
                          title={isStarred ? 'Remover de watchlist' : 'Agregar a watchlist'}
                        >
                          <Star 
                            className={`w-6 h-6 ${isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        </button>
                        
                        <button
                          onClick={() => handleExportSingle(signal)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition"
                          title="Exportar CSV"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getSignalColor(signal.signal)}`}>
                        {signal.signal}
                      </span>
                      
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getAuthorColor(signal.dominantAuthor)}`}>
                        {signal.dominantAuthor}
                      </span>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Trinity Score</div>
                        <div className="text-2xl font-bold text-blue-600">{signal.trinityScore}/100</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                            style={{ width: `${signal.trinityScore}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Technical Score</div>
                        <div className="text-2xl font-bold text-purple-600">{signal.technicalScore}/100</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                            style={{ width: `${signal.technicalScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Precio</div>
                        <div className="font-semibold text-gray-900">${signal.price}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Target</div>
                        <div className="font-semibold text-green-600">${signal.targetPrice}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Stop Loss</div>
                        <div className="font-semibold text-red-600">${signal.stopLoss}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">RSI</div>
                        <div className="font-semibold text-gray-900">{signal.rsi}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">MACD</div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getMacdColor(signal.macdSignal)}`}>
                          {signal.macdSignal}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Volumen</div>
                        <div className="font-semibold text-gray-900">{(signal.volume / 1000000).toFixed(1)}M</div>
                      </div>
                    </div>
                    
                    {/* Expandable Reason */}
                    <div className="border-t border-gray-200 pt-4">
                      <button
                        onClick={() => toggleExpand(signal.rank)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <span className="text-sm font-semibold text-gray-700">Razón del Signal</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{signal.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ticker</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Signal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trinity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Technical</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Target</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Author</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockDailyTop10.map((signal, idx) => {
                  const isStarred = isFavorite(signal.ticker);
                  
                  return (
                    <tr key={signal.rank} className={`border-b border-gray-200 hover:bg-gray-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                          signal.rank <= 3 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}>
                          {signal.rank}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-bold text-gray-900">{signal.ticker}</div>
                          <div className="text-sm text-gray-600">{signal.company}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getSignalColor(signal.signal)}`}>
                          {signal.signal}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                              style={{ width: `${signal.trinityScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">{signal.trinityScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                              style={{ width: `${signal.technicalScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">{signal.technicalScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-gray-900">${signal.price}</td>
                      <td className="px-4 py-4 font-semibold text-green-600">${signal.targetPrice}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getAuthorColor(signal.dominantAuthor)}`}>
                          {signal.dominantAuthor}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              isStarred ? removeTicker(signal.ticker) : addTicker(signal.ticker);
                            }}
                            className="transition hover:scale-110"
                            title={isStarred ? 'Remover de watchlist' : 'Agregar a watchlist'}
                          >
                            <Star 
                              className={`w-5 h-5 ${isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          </button>
                          
                          <button
                            onClick={() => handleExportSingle(signal)}
                            className="text-gray-400 hover:text-gray-600 transition"
                            title="Exportar CSV"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
