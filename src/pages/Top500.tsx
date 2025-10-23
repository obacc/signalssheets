import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SignalBadge } from '../components/ui/SignalBadge';
import { AuthorBadge } from '../components/ui/AuthorBadge';
import { TrinityScoreBar } from '../components/ui/TrinityScoreBar';
import { WatchlistStar } from '../components/ui/WatchlistStar';
import { mockSignals } from '../lib/mockData';
import { Search, Download } from 'lucide-react';

const Top500 = () => {
  const [search, setSearch] = useState('');
  const [signalFilter, setSignalFilter] = useState<string>('ALL');
  const [authorFilter, setAuthorFilter] = useState<string>('ALL');

  // Filter logic
  const filteredSignals = mockSignals.filter(signal => {
    const matchesSearch = signal.ticker.toLowerCase().includes(search.toLowerCase()) ||
                         signal.company.toLowerCase().includes(search.toLowerCase());
    const matchesSignal = signalFilter === 'ALL' || signal.signal === signalFilter;
    const matchesAuthor = authorFilter === 'ALL' || signal.dominantAuthor === authorFilter;

    return matchesSearch && matchesSignal && matchesAuthor;
  });

  const handleExportCSV = () => {
    // CSV export with Spanish headers
    const headers = ['Ticker', 'Empresa', 'Señal', 'Trinity Score', 'Autor', 'Precio', 'Objetivo', 'Sector'];
    const rows = filteredSignals.map(s => [
      s.ticker, s.company, s.signal, s.trinityScore, s.dominantAuthor,
      s.price, s.targetPrice, s.sector
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'indicium-signals-top500.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">TOP 500 Señales Trinity</h1>
          <p className="text-slate-600">Lista completa de acciones analizadas con el Trinity Method</p>
        </div>

        {/* Filters Card */}
        <Card className="mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Buscar Ticker o Empresa
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ej: NVDA o Apple"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Signal Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Señal
              </label>
              <select
                value={signalFilter}
                onChange={(e) => setSignalFilter(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="ALL">Todas las Señales</option>
                <option value="BUY">BUY</option>
                <option value="HOLD">HOLD</option>
                <option value="SELL">SELL</option>
              </select>
            </div>

            {/* Author Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Autor Dominante
              </label>
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="ALL">Todos los Autores</option>
                <option value="Lynch">Lynch</option>
                <option value="O'Neil">O'Neil</option>
                <option value="Graham">Graham</option>
              </select>
            </div>
          </div>

          {/* Results Count & Export */}
          <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Mostrando <span className="font-semibold">{filteredSignals.length}</span> señales
            </p>
            <Button variant="secondary" onClick={handleExportCSV}>
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </div>
        </Card>

        {/* Signals Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-center py-3 px-2 text-sm font-semibold text-slate-700">★</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Ticker</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Empresa</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Señal</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Trinity Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Autor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Sector</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Precio</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Potencial</th>
                </tr>
              </thead>
              <tbody>
                {filteredSignals.map((signal) => (
                  <tr key={signal.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2">
                      <div className="flex justify-center">
                        <WatchlistStar ticker={signal.ticker} size="sm" />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{signal.ticker}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">
                      {signal.company}
                    </td>
                    <td className="py-3 px-4">
                      <SignalBadge signal={signal.signal} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <TrinityScoreBar score={signal.trinityScore} showLabel={false} />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{signal.trinityScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <AuthorBadge author={signal.dominantAuthor} />
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {signal.sector}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      ${signal.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={'font-bold ' + (signal.potentialReturn > 0 ? 'text-buy' : 'text-sell')}>
                        {signal.potentialReturn > 0 ? '+' : ''}{signal.potentialReturn.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Top500;
