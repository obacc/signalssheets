import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import SignalsTable from '../components/dashboard/SignalsTable';
import Filters from '../components/dashboard/Filters';
import { Signal, SignalFilters } from '../types';
import { mockSignals } from '../utils/mockData';

export default function Dashboard() {
  const [filters, setFilters] = useState<SignalFilters>({
    search: '',
    signal: 'ALL',
    author: 'ALL',
    riskProfile: 'ALL',
    sector: 'ALL',
    minTrinityScore: 0,
    maxTrinityScore: 100,
  });

  // Filtrar señales según criterios
  const filteredSignals = mockSignals.filter((signal) => {
    if (filters.search && !signal.ticker.toLowerCase().includes(filters.search.toLowerCase()) &&
        !signal.companyName.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.signal !== 'ALL' && signal.signal !== filters.signal) return false;
    if (filters.author !== 'ALL' && signal.author !== filters.author) return false;
    if (filters.riskProfile !== 'ALL' && signal.riskProfile !== filters.riskProfile) return false;
    if (filters.sector !== 'ALL' && signal.sector !== filters.sector) return false;
    if (signal.trinityScore < filters.minTrinityScore || signal.trinityScore > filters.maxTrinityScore) {
      return false;
    }
    return true;
  });

  // Calcular estadísticas - CON VALIDACIÓN
  const buySignals = filteredSignals.filter(s => s.signal === 'BUY').length;
  const sellSignals = filteredSignals.filter(s => s.signal === 'SELL').length;
  const holdSignals = filteredSignals.filter(s => s.signal === 'HOLD').length;
  
  // CRÍTICO: Validar antes de calcular promedio
  const avgScore = filteredSignals.length > 0 
    ? (filteredSignals.reduce((acc, s) => acc + s.trinityScore, 0) / filteredSignals.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Trinity Method</h1>
              <p className="text-sm text-gray-500 mt-1">
                Señales activas del TOP 500 tickers
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Última actualización: {new Date().toLocaleDateString('es-ES')}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Señales */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Señales</p>
                <p className="text-3xl font-bold text-gray-900">{filteredSignals.length}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-primary-500" />
            </div>
          </div>

          {/* BUY Signals */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Señales BUY</p>
                <p className="text-3xl font-bold text-success">{buySignals}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-success" />
            </div>
          </div>

          {/* SELL Signals */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Señales SELL</p>
                <p className="text-3xl font-bold text-danger">{sellSignals}</p>
              </div>
              <TrendingDown className="w-10 h-10 text-danger" />
            </div>
          </div>

          {/* HOLD Signals */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Señales HOLD</p>
                <p className="text-3xl font-bold text-warning">{holdSignals}</p>
              </div>
              <Minus className="w-10 h-10 text-warning" />
            </div>
          </div>
        </div>

        {/* Average Trinity Score */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm mb-2">Trinity Score Promedio</p>
              <p className="text-5xl font-bold">{avgScore.toFixed(1)}/100</p>
            </div>
            <div className="text-right">
              <p className="text-primary-100 text-sm mb-1">Calidad de Señales</p>
              <p className="text-2xl font-semibold">
                {avgScore >= 80 ? 'Excelente' : avgScore >= 60 ? 'Buena' : 'Moderada'}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Filters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Signals Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <SignalsTable signals={filteredSignals} />
        </div>
      </div>
    </div>
  );
}