import { useState, useMemo } from 'react';
import { Star, Download, Upload, Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useWatchlistStore } from '../store/watchlistStore';
import { mockSignals } from '../utils/mockData';

export default function Watchlist() {
  const { tickers, addTicker, removeTicker, clearWatchlist, importWatchlist } = useWatchlistStore();
  const [newTicker, setNewTicker] = useState('');
  const [filterSignal, setFilterSignal] = useState<'ALL' | 'BUY' | 'SELL' | 'HOLD'>('ALL');

  // Filtrar señales basadas en watchlist
  const watchlistSignals = useMemo(() => {
    const signals = mockSignals.filter(signal => 
      tickers.includes(signal.ticker)
    );
    
    if (filterSignal === 'ALL') return signals;
    return signals.filter(s => s.signal === filterSignal);
  }, [tickers, filterSignal]);

  // Estadísticas
  const stats = useMemo(() => {
    const buy = watchlistSignals.filter(s => s.signal === 'BUY').length;
    const sell = watchlistSignals.filter(s => s.signal === 'SELL').length;
    const hold = watchlistSignals.filter(s => s.signal === 'HOLD').length;
    const avgScore = watchlistSignals.length > 0
      ? watchlistSignals.reduce((sum, s) => sum + s.trinityScore, 0) / watchlistSignals.length
      : 0;
    
    return { buy, sell, hold, total: watchlistSignals.length, avgScore };
  }, [watchlistSignals]);

  const handleAddTicker = () => {
    if (newTicker.trim()) {
      addTicker(newTicker);
      setNewTicker('');
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Ticker', 'Score Trinity', 'Señal', 'Sector', 'Fecha'],
      ...watchlistSignals.map(s => [
        s.ticker,
        s.trinityScore ? s.trinityScore.toFixed(2) : '0.00',
        s.signal,
        s.sector,
        s.date || new Date().toISOString().split('T')[0]
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchlist_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const tickers = text.split(/[\n,\s]+/).filter(t => t.trim().length > 0);
        importWatchlist(tickers);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">⭐ Mi Watchlist</h1>
            <p className="text-gray-600">
              {tickers.length} tickers en seguimiento
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleImportCSV}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Upload className="w-4 h-4" />
              Importar
            </button>
            
            <button
              onClick={handleExportCSV}
              disabled={watchlistSignals.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
            
            {tickers.length > 0 && (
              <button
                onClick={clearWatchlist}
                className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Agregar ticker */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Agregar Ticker</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTicker()}
              placeholder="Ej: AAPL, MSFT, TSLA..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={5}
            />
            <button
              onClick={handleAddTicker}
              disabled={!newTicker.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Agregar
            </button>
          </div>
          
          {/* Lista de tickers */}
          {tickers.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tickers.map(ticker => (
                <div
                  key={ticker}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg group hover:bg-blue-200 transition"
                >
                  <Star className="w-4 h-4 fill-blue-500" />
                  <span className="font-semibold">{ticker}</span>
                  <button
                    onClick={() => removeTicker(ticker)}
                    className="opacity-0 group-hover:opacity-100 transition text-blue-700 hover:text-blue-900"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estadísticas */}
        {watchlistSignals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Total Señales</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            
            <div className="bg-green-50 rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Señales BUY</div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div className="text-3xl font-bold text-green-600">{stats.buy}</div>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Señales SELL</div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <div className="text-3xl font-bold text-red-600">{stats.sell}</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Score Promedio</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.avgScore ? stats.avgScore.toFixed(1) : '0.0'}/100
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        {watchlistSignals.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex gap-2">
              {(['ALL', 'BUY', 'HOLD', 'SELL'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setFilterSignal(filter)}
                  className={`px-4 py-2 rounded-lg transition ${
                    filterSignal === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'ALL' ? 'Todas' : filter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabla de señales */}
        {tickers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Tu watchlist está vacía
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza agregando tickers que quieras seguir
            </p>
          </div>
        ) : watchlistSignals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-lg text-gray-600">
              No hay señales disponibles para los filtros seleccionados
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ticker</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Señal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Score Trinity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Sector</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acción</th>
                </tr>
              </thead>
              <tbody>
                {watchlistSignals.map((signal, idx) => (
                  <tr key={signal.ticker} className={`border-b border-gray-200 hover:bg-gray-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-4">
                      <span className="font-bold text-gray-900">{signal.ticker}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-md text-sm font-semibold ${
                        signal.signal === 'BUY' ? 'bg-green-100 text-green-700' :
                        signal.signal === 'SELL' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {signal.signal}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                            style={{ width: `${signal.trinityScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{signal.trinityScore ? signal.trinityScore.toFixed(1) : '0.0'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{signal.sector}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {signal.date || new Date().toISOString().split('T')[0]}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => removeTicker(signal.ticker)}
                        className="text-red-500 hover:text-red-700 transition"
                        title="Remover de watchlist"
                      >
                        <Star className="w-5 h-5 fill-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
