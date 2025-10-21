import { useState, useMemo } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { mockSignals } from '../utils/mockData';

type SortField = 'trinityScore' | 'lynchScore' | 'oneilScore' | 'grahamScore' | 'ticker';
type SortDirection = 'asc' | 'desc';

export default function Top500() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('trinityScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filtrar y ordenar señales
  const sortedSignals = useMemo(() => {
    let filtered = mockSignals;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    return [...filtered].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Para strings (ticker)
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Para números - CON VALIDACIÓN
      const aNum = typeof aVal === 'number' ? aVal : 0;
      const bNum = typeof bVal === 'number' ? bVal : 0;
      
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }, [searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">TOP 500 Tickers</h1>
          <p className="text-gray-600 mt-2">
            Ranking completo de los mejores tickers según Trinity Method
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por ticker o nombre de empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Tickers</p>
              <p className="text-3xl font-bold text-gray-900">{sortedSignals.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Score Promedio</p>
              <p className="text-3xl font-bold text-primary-600">
                {sortedSignals.length > 0 
                  ? (sortedSignals.reduce((acc, s) => acc + s.trinityScore, 0) / sortedSignals.length).toFixed(1)
                  : '0.0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Mejor Score</p>
              <p className="text-3xl font-bold text-success">
                {sortedSignals.length > 0 
                  ? Math.max(...sortedSignals.map(s => s.trinityScore)).toFixed(1)
                  : '0.0'}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('ticker')}
                      className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-primary-600"
                    >
                      Ticker
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleSort('trinityScore')}
                      className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-primary-600 w-full"
                    >
                      Trinity Score
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleSort('lynchScore')}
                      className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-primary-600 w-full"
                    >
                      Lynch
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleSort('oneilScore')}
                      className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-primary-600 w-full"
                    >
                      O'Neil
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleSort('grahamScore')}
                      className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-primary-600 w-full"
                    >
                      Graham
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Sector
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedSignals.map((signal, index) => (
                  <tr key={signal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                        <span className="text-sm font-bold text-gray-900">{signal.ticker}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{signal.companyName}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary-100 text-primary-800">
                        {signal.trinityScore.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {signal.lynchScore.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {signal.oneilScore.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {signal.grahamScore.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{signal.sector}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedSignals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron resultados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}