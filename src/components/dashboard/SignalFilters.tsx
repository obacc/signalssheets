import React, { useState } from 'react';
import { Search, BookOpen, TrendingUp, Shield } from 'lucide-react';

interface FilterState {
  search: string;
  signalTypes: ('BUY' | 'HOLD' | 'SELL')[];
  authors: ('Lynch' | 'O\'Neil' | 'Graham')[];
  sectors: string[];
  trinityScoreMin: number;
  riskProfiles: ('Conservative' | 'Moderate' | 'Aggressive')[];
}

interface SignalFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  totalSignals: number;
  filteredCount: number;
}

const SignalFilters: React.FC<SignalFiltersProps> = ({ 
  onFilterChange, 
  totalSignals, 
  filteredCount 
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    signalTypes: [],
    authors: [],
    sectors: [],
    trinityScoreMin: 0,
    riskProfiles: [],
  });

  // Actualizar filtros y notificar al padre
  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const handleSearchChange = (value: string) => {
    updateFilters({ search: value });
  };

  const toggleSignalType = (type: 'BUY' | 'HOLD' | 'SELL') => {
    const updated = filters.signalTypes.includes(type)
      ? filters.signalTypes.filter(t => t !== type)
      : [...filters.signalTypes, type];
    updateFilters({ signalTypes: updated });
  };

  const toggleAuthor = (author: 'Lynch' | 'O\'Neil' | 'Graham') => {
    const updated = filters.authors.includes(author)
      ? filters.authors.filter(a => a !== author)
      : [...filters.authors, author];
    updateFilters({ authors: updated });
  };

  const toggleRiskProfile = (profile: 'Conservative' | 'Moderate' | 'Aggressive') => {
    const updated = filters.riskProfiles.includes(profile)
      ? filters.riskProfiles.filter(p => p !== profile)
      : [...filters.riskProfiles, profile];
    updateFilters({ riskProfiles: updated });
  };

  const handleScoreChange = (value: number) => {
    updateFilters({ trinityScoreMin: value });
  };

  const handleResetFilters = () => {
    const reset: FilterState = {
      search: '',
      signalTypes: [],
      authors: [],
      sectors: [],
      trinityScoreMin: 0,
      riskProfiles: [],
    };
    setFilters(reset);
    onFilterChange(reset);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl p-6 mb-6">
      
      {/* Header con contador */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">Filtros Avanzados</h3>
          <p className="text-sm text-neutral-600">
            Mostrando {filteredCount} de {totalSignals} señales
          </p>
        </div>
        <button 
          onClick={handleResetFilters}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Grid de filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Buscar Ticker/Empresa
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Ej: AAPL, Apple..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg 
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         text-sm transition-all duration-200"
            />
          </div>
        </div>

        {/* Signal Type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Tipo de Señal
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleSignalType('BUY')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200
                ${filters.signalTypes.includes('BUY')
                  ? 'bg-success-500 text-white border-success-500'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-success-500 hover:bg-success-50'
                }`}
            >
              BUY
            </button>
            <button
              onClick={() => toggleSignalType('HOLD')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200
                ${filters.signalTypes.includes('HOLD')
                  ? 'bg-warning-500 text-white border-warning-500'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-warning-500 hover:bg-warning-50'
                }`}
            >
              HOLD
            </button>
            <button
              onClick={() => toggleSignalType('SELL')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200
                ${filters.signalTypes.includes('SELL')
                  ? 'bg-danger-500 text-white border-danger-500'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-danger-500 hover:bg-danger-50'
                }`}
            >
              SELL
            </button>
          </div>
        </div>

        {/* Autor Dominante */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Autor Dominante
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleAuthor('Lynch')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 flex items-center gap-1
                ${filters.authors.includes('Lynch')
                  ? 'bg-success-500 text-white border-success-500'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-success-500 hover:bg-success-50'
                }`}
            >
              <BookOpen className="w-3 h-3" />
              Lynch
            </button>
            <button
              onClick={() => toggleAuthor('O\'Neil')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 flex items-center gap-1
                ${filters.authors.includes('O\'Neil')
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary-600 hover:bg-primary-50'
                }`}
            >
              <TrendingUp className="w-3 h-3" />
              O'Neil
            </button>
            <button
              onClick={() => toggleAuthor('Graham')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 flex items-center gap-1
                ${filters.authors.includes('Graham')
                  ? 'bg-info-500 text-white border-info-500'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-info-500 hover:bg-info-50'
                }`}
            >
              <Shield className="w-3 h-3" />
              Graham
            </button>
          </div>
        </div>

        {/* Trinity Score Mínimo */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Trinity Score Mínimo: {filters.trinityScoreMin}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={filters.trinityScoreMin}
            onChange={(e) => handleScoreChange(Number(e.target.value))}
            className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-primary-600
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:transition-all
                       [&::-webkit-slider-thumb]:duration-200"
          />
          <div className="flex justify-between text-xs text-neutral-500 mt-1">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        {/* Risk Profile */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Perfil de Riesgo
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleRiskProfile('Conservative')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200
                ${filters.riskProfiles.includes('Conservative')
                  ? 'bg-neutral-700 text-white border-neutral-700'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-700 hover:bg-neutral-50'
                }`}
            >
              Conservador
            </button>
            <button
              onClick={() => toggleRiskProfile('Moderate')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200
                ${filters.riskProfiles.includes('Moderate')
                  ? 'bg-warning-500 text-white border-warning-500'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-warning-500 hover:bg-warning-50'
                }`}
            >
              Moderado
            </button>
            <button
              onClick={() => toggleRiskProfile('Aggressive')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200
                ${filters.riskProfiles.includes('Aggressive')
                  ? 'bg-danger-500 text-white border-danger-500'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-danger-500 hover:bg-danger-50'
                }`}
            >
              Agresivo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SignalFilters;
