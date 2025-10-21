import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Search, Star } from 'lucide-react';
import type { Signal } from '../../types';
import { useWatchlistStore } from '../../store/watchlistStore';

interface SignalsTableProps {
  signals: Signal[];
}

type SortField = keyof Signal | null;
type SortDirection = 'asc' | 'desc' | null;

const SignalsTable: React.FC<SignalsTableProps> = ({ signals }) => {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { addTicker, removeTicker, isFavorite } = useWatchlistStore();

  // Filtrar y ordenar datos
  const filteredAndSortedSignals = useMemo(() => {
    let filtered = signals.filter(signal => 
      signal.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signal.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signal.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signal.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal || '');
        const bStr = String(bVal || '');
        return sortDirection === 'asc' 
          ? aStr.localeCompare(bStr) 
          : bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [signals, searchTerm, sortField, sortDirection]);

  // Paginación
  const totalPages = Math.ceil(filteredAndSortedSignals.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSignals = filteredAndSortedSignals.slice(startIndex, endIndex);

  // Manejar sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Ticker', 'Empresa', 'Señal', 'Trinity Score', 'Lynch', "O'Neil", 'Graham',
      'Precio', 'Target', 'Stop Loss', 'Expected Return %', 'Sector', 'Autor', 'Risk Profile'
    ];
    
    const rows = filteredAndSortedSignals.map(signal => [
      signal.ticker,
      signal.companyName,
      signal.signal,
      signal.trinityScore ? signal.trinityScore.toFixed(1) : '0.0',
      signal.lynchScore,
      signal.oneilScore,
      signal.grahamScore,
      signal.price ? signal.price.toFixed(2) : '0.00',
      signal.targetPrice?.toFixed(2) || '-',
      signal.stopLoss?.toFixed(2) || '-',
      signal.expectedReturn?.toFixed(1) || '-',
      signal.sector,
      signal.author,
      signal.riskProfile,
    ]);
    
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `indicium-signals-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };


  return (
    <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">
              Tabla de Señales Completa
            </h3>
            <p className="text-sm text-neutral-600">
              {filteredAndSortedSignals.length} señales
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar en todas las columnas..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap w-16">
                  ⭐
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap w-20">
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100" onClick={() => handleSort('ticker')}>
                    Ticker
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    {sortField === 'ticker' && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap w-48">
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100" onClick={() => handleSort('companyName')}>
                    Empresa
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    {sortField === 'companyName' && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap w-20">
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100" onClick={() => handleSort('signal')}>
                    Señal
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    {sortField === 'signal' && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap w-24">
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100" onClick={() => handleSort('trinityScore')}>
                    Trinity
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    {sortField === 'trinityScore' && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap w-16">
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100" onClick={() => handleSort('lynchScore')}>
                    Lynch
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    {sortField === 'lynchScore' && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap w-16">
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100" onClick={() => handleSort('oneilScore')}>
                    O'Neil
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    {sortField === 'oneilScore' && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap w-16">
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100" onClick={() => handleSort('grahamScore')}>
                    Graham
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    {sortField === 'grahamScore' && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap w-20">
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100" onClick={() => handleSort('price')}>
                    Precio
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    {sortField === 'price' && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap w-20">
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100" onClick={() => handleSort('targetPrice')}>
                    Target
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    {sortField === 'targetPrice' && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap w-20">
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100" onClick={() => handleSort('stopLoss')}>
                    Stop
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    {sortField === 'stopLoss' && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap w-20">
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100" onClick={() => handleSort('expectedReturn')}>
                    Retorno
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    {sortField === 'expectedReturn' && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap w-28">
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100" onClick={() => handleSort('sector')}>
                    Sector
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    {sortField === 'sector' && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap w-20">
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100" onClick={() => handleSort('author')}>
                    Autor
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    {sortField === 'author' && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap w-24">
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100" onClick={() => handleSort('riskProfile')}>
                    Riesgo
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    {sortField === 'riskProfile' && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {paginatedSignals.map((signal) => {
                const isStarred = isFavorite(signal.ticker);
                return (
                <tr key={signal.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        isStarred ? removeTicker(signal.ticker) : addTicker(signal.ticker);
                      }}
                      className="transition hover:scale-110"
                      title={isStarred ? 'Remover de watchlist' : 'Agregar a watchlist'}
                    >
                      <Star 
                        className={`w-5 h-5 ${isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    </button>
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    <div className="font-bold text-neutral-900">{signal.ticker}</div>
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    <div className="max-w-[180px] truncate text-neutral-700">
                      {signal.companyName}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        signal.signal === 'BUY'
                          ? 'bg-success-500 text-white'
                          : signal.signal === 'HOLD'
                          ? 'bg-warning-500 text-white'
                          : 'bg-danger-500 text-white'
                      }`}
                    >
                      {signal.signal}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    <div className={`px-2 py-1 rounded font-bold text-center ${
                      signal.trinityScore >= 80 ? 'text-success-600 bg-success-50' :
                      signal.trinityScore >= 70 ? 'text-success-500 bg-success-50' :
                      signal.trinityScore >= 60 ? 'text-warning-600 bg-warning-50' :
                      'text-neutral-600 bg-neutral-50'
                    }`}>
                      {signal.trinityScore ? signal.trinityScore.toFixed(1) : '0.0'}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    <div className="text-center text-success-600 font-semibold">
                      {signal.lynchScore}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    <div className="text-center text-primary-600 font-semibold">
                      {signal.oneilScore}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    <div className="text-center text-info-600 font-semibold">
                      {signal.grahamScore}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    <div className="text-neutral-900 font-medium">
                      ${signal.price ? signal.price.toFixed(2) : '0.00'}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    <div className="text-success-600 font-medium">
                      ${signal.targetPrice?.toFixed(2) || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    <div className="text-danger-600 font-medium">
                      ${signal.stopLoss?.toFixed(2) || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    <div className="text-success-600 font-semibold">
                      {signal.expectedReturn ? signal.expectedReturn.toFixed(1) : '0.0'}%
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    <div className="text-xs text-neutral-600 max-w-[120px] truncate">
                      {signal.sector}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        signal.author === 'Lynch'
                          ? 'bg-success-100 text-success-700'
                          : signal.author === "O'Neil"
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-info-100 text-info-700'
                      }`}
                    >
                      {signal.author}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    <div className="text-xs text-neutral-600">{signal.riskProfile}</div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hint de scroll horizontal */}
      <div className="lg:hidden text-center py-2 text-xs text-neutral-500">
        ← Desliza horizontalmente para ver todas las columnas →
      </div>

      {/* Paginación */}
      <div className="p-4 border-t border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Filas por página:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SignalsTable;