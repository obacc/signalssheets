import { useState, useEffect } from 'react';
import SignalsTable from '../components/dashboard/SignalsTable';
import Filters from '../components/dashboard/Filters';
import Chart from '../components/dashboard/Chart';
import type { Signal, SignalFilters, MarketRegimeData } from '../types';
import { mockSignals as signals, marketRegimeHistory } from '../utils/mockData';
import { TrendingUp, Activity, DollarSign } from 'lucide-react';

export function Dashboard() {
  const [filteredSignals, setFilteredSignals] = useState<Signal[]>(signals);
  const [filters, setFilters] = useState<SignalFilters>({});
  const [currentRegime, setCurrentRegime] = useState<MarketRegimeData | null>(null);

  useEffect(() => {
    if (marketRegimeHistory && marketRegimeHistory.length > 0) {
      setCurrentRegime(marketRegimeHistory[0]);
    }
  }, []);

  useEffect(() => {
    let result = [...signals];
    
    if (filters.search) {
      result = result.filter(s => 
        s.ticker.toLowerCase().includes(filters.search!.toLowerCase()) ||
        s.companyName.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }
    
    if (filters.signalType && filters.signalType !== 'ALL') {
      result = result.filter(s => s.signal === filters.signalType);
    }
    
    if (filters.author && filters.author !== 'ALL') {
      result = result.filter(s => s.dominantAuthor === filters.author);
    }
    
    if (filters.sector) {
      result = result.filter(s => s.sector === filters.sector);
    }
    
    if (filters.minScore) {
      result = result.filter(s => s.strength >= filters.minScore!);
    }
    
    setFilteredSignals(result);
  }, [filters]);

  // Calcular estadísticas con null checks
  const stats = {
    totalSignals: filteredSignals.length,
    buySignals: filteredSignals.filter(s => s.signal === 'BUY').length,
    avgScore: filteredSignals.length > 0 
      ? filteredSignals.reduce((acc, s) => acc + (s.strength || 0), 0) / filteredSignals.length 
      : 0,
    topGainer: filteredSignals.reduce((max, s) => 
      (s.change || 0) > (max?.change || 0) ? s : max, 
      filteredSignals[0]
    )
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Trinity Method Trading Signals</p>
        </div>

        {/* Market Regime Indicator */}
        {currentRegime && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Market Regime</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <span className="text-sm text-gray-600">Overall</span>
                <p className={`text-xl font-bold ${
                  currentRegime.overall_regime === 'BULLISH' ? 'text-green-600' : 
                  currentRegime.overall_regime === 'BEARISH' ? 'text-red-600' : 
                  'text-yellow-600'
                }`}>
                  {currentRegime.overall_regime}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">VIX</span>
                <p className="text-xl font-bold">{currentRegime.vix?.toFixed(2) || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Put/Call</span>
                <p className="text-xl font-bold">{currentRegime.put_call_ratio?.toFixed(2) || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">High/Low</span>
                <p className="text-xl font-bold">{currentRegime.high_low_index?.toFixed(1) || 'N/A'}%</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Strength</span>
                <p className="text-xl font-bold">{currentRegime.regime_strength?.toFixed(0) || 0}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Signals</p>
                <p className="text-2xl font-bold">{stats.totalSignals}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Buy Signals</p>
                <p className="text-2xl font-bold text-green-600">{stats.buySignals}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Trinity Score</p>
                <p className="text-2xl font-bold">{stats.avgScore.toFixed(1)}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Top Gainer</p>
                <p className="text-lg font-bold">{stats.topGainer?.ticker || 'N/A'}</p>
                <p className="text-sm text-green-600">
                  +{stats.topGainer?.change?.toFixed(1) || 0}%
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        <Filters onChange={(filters) => {
          setFilters({
            author: filters.strategy === 'all' ? 'ALL' : 
                   filters.strategy === 'lynch' ? 'Lynch' :
                   filters.strategy === 'oneil' ? 'O\'Neil' : 'Graham',
            minScore: filters.minScore
          });
        }} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2">
            <SignalsTable signals={filteredSignals} />
          </div>
          <div>
            <Chart />
          </div>
        </div>
      </div>
    </div>
  );
}