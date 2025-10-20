import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import Footer from '../components/layout/Footer'
import Filters from '../components/dashboard/Filters'
import Chart from '../components/dashboard/Chart'
import TrinityScoreCard from '../components/TrinityScoreCard'
import SignalFilters from '../components/dashboard/SignalFilters'
import StatsOverview from '../components/dashboard/StatsOverview'
import ExportToSheets from '../components/dashboard/ExportToSheets'
import SignalsTable from '../components/dashboard/SignalsTable'
import { useSignals } from '../hooks/useSignals'
import { useState, useMemo } from 'react'

interface FilterState {
  search: string;
  signalTypes: ('BUY' | 'HOLD' | 'SELL')[];
  authors: ('Lynch' | 'O\'Neil' | 'Graham')[];
  sectors: string[];
  trinityScoreMin: number;
  riskProfiles: ('Conservative' | 'Moderate' | 'Aggressive')[];
}

export default function Dashboard(){
  const { data = [], isLoading } = useSignals()
  // const [minScore, setMinScore] = useState(0)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    signalTypes: [],
    authors: [],
    sectors: [],
    trinityScoreMin: 0,
    riskProfiles: [],
  });

  // Filtrado de señales con useMemo para performance
  const filteredSignals = useMemo(() => {
    return data.filter((signal) => {
      // Filtro de búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTicker = signal.ticker.toLowerCase().includes(searchLower);
        const matchesCompany = signal.companyName.toLowerCase().includes(searchLower);
        if (!matchesTicker && !matchesCompany) return false;
      }

      // Filtro de signal type
      if (filters.signalTypes.length > 0) {
        if (!filters.signalTypes.includes(signal.signal)) return false;
      }

      // Filtro de autor
      if (filters.authors.length > 0) {
        if (!filters.authors.includes(signal.author)) return false;
      }

      // Filtro de Trinity Score
      if (signal.trinityScore < filters.trinityScoreMin) return false;

      // Filtro de Risk Profile
      if (filters.riskProfiles.length > 0) {
        if (!filters.riskProfiles.includes(signal.riskProfile)) return false;
      }

      return true;
    });
  }, [data, filters]);

  // Mantener compatibilidad con filtro anterior
  // const filtered = filteredSignals.filter(s => s.trinityScore >= minScore)

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <Header />
      
      {/* Container principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section con KPI Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Trinity Signals Dashboard
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                Señales de Trading EOD • Actualizado hace 3h
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></span>
              <span>Sistema activo</span>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Régimen de Mercado */}
            <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-600 uppercase">Régimen</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-block px-4 py-2 bg-warning-500 text-white font-bold text-lg rounded-lg">
                  NEUTRAL
                </span>
              </div>
              <div className="mt-3 text-xs text-neutral-600">
                VIX: 18.5 • Breadth: 65%
              </div>
            </div>

            {/* Card 2: % BUY Hoy */}
            <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-600 uppercase">% BUY Hoy</div>
                  </div>
                </div>
              </div>
              <div className="text-4xl font-bold text-success-600 mb-2">12.5%</div>
              <div className="w-full bg-neutral-200 rounded-full h-2 mb-2">
                <div className="bg-success-500 h-2 rounded-full" style={{ width: '62%' }}></div>
              </div>
              <div className="text-xs text-success-600 font-medium">
                Dentro de banda objetivo (5-18%)
              </div>
            </div>

            {/* Card 3: Señales Activas */}
            <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-600 uppercase">Señales Activas</div>
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary-600">1,132</span>
                <span className="text-sm font-semibold text-success-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  +45
                </span>
              </div>
              <div className="text-xs text-neutral-600 mt-2">
                vs ayer • TOP 500 disponible
              </div>
            </div>

          </div>
        </div>

        {/* Filtros Avanzados */}
        <SignalFilters
          onFilterChange={setFilters}
          totalSignals={data.length}
          filteredCount={filteredSignals.length}
        />

        {/* Estadísticas de Señales */}
        <StatsOverview signals={filteredSignals} />

        {/* Trinity Signals Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                🏆 Top Trinity Signals
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                Las mejores oportunidades según el Trinity Method
              </p>
            </div>
            {/* Botón de Export */}
            <ExportToSheets signals={filteredSignals} />
          </div>

          {/* Filtros Rápidos */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-primary-500 hover:bg-primary-50 rounded-lg text-sm font-medium text-neutral-700 hover:text-primary-700 transition-all duration-200">
              Todos
            </button>
            <button className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-success-500 hover:bg-success-50 rounded-lg text-sm font-medium text-neutral-700 hover:text-success-700 transition-all duration-200">
              Solo BUY
            </button>
            <button className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-primary-500 hover:bg-primary-50 rounded-lg text-sm font-medium text-neutral-700 hover:text-primary-700 transition-all duration-200">
              Lynch
            </button>
            <button className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-primary-500 hover:bg-primary-50 rounded-lg text-sm font-medium text-neutral-700 hover:text-primary-700 transition-all duration-200">
              O'Neil
            </button>
            <button className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-primary-500 hover:bg-primary-50 rounded-lg text-sm font-medium text-neutral-700 hover:text-primary-700 transition-all duration-200">
              Graham
            </button>
          </div>

          {/* Grid de TrinityScoreCards */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-neutral-500">Cargando señales...</div>
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-neutral-700 mb-2">
                No se encontraron señales
              </h3>
              <p className="text-neutral-500">
                Intenta ajustar los filtros para ver más resultados
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSignals.map((signal, index) => (
                <div 
                  key={signal.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TrinityScoreCard
                    lynchScore={signal.lynchScore}
                    oneilScore={signal.oneilScore}
                    grahamScore={signal.grahamScore}
                    trinityScore={signal.trinityScore}
                    dominantAuthor={signal.author}
                    ticker={signal.ticker}
                    companyName={signal.companyName}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabla Completa - Fuera del grid para mejor control de ancho */}
        <div className="mb-8">
          <SignalsTable signals={filteredSignals} />
        </div>

        {/* Secciones adicionales (mantenidas del diseño original) */}
        <div className="grid md:grid-cols-[16rem_1fr] gap-6">
          <Sidebar />
          <main className="space-y-6">
            <section className="rounded-2xl border bg-white p-4">
              <h2 className="text-lg font-bold mb-3">Filtros Avanzados</h2>
              <Filters onChange={(f)=> console.log('Min score:', f.minScore)} />
            </section>
            <section className="rounded-2xl border bg-white p-4">
              <h2 className="text-lg font-bold mb-3">Análisis Técnico</h2>
              <Chart />
            </section>
          </main>
        </div>
        
      </div>
      
      <Footer />
    </div>
  )
}
