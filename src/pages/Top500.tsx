import { useState, useEffect } from 'react';
import type { Signal, MarketRegimeData, SignalType } from '../types';
import { mockSignals as signals, marketRegimeHistory } from '../utils/mockData';
import { Search, Download, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

export function Top500() {
  const [filteredSignals, setFilteredSignals] = useState<Signal[]>(signals);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<'ALL' | 'Lynch' | 'O\'Neil' | 'Graham'>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [currentRegime, setCurrentRegime] = useState<MarketRegimeData | null>(null);
  const [sortBy, setSortBy] = useState<'trinity_score' | 'potential_return' | 'ticker'>('trinity_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (marketRegimeHistory && marketRegimeHistory.length > 0) {
      setCurrentRegime(marketRegimeHistory[0]);
    }
  }, []);

  const sectors = ['ALL', ...Array.from(new Set(signals.map(s => s.sector)))];

  useEffect(() => {
    let result = [...signals];
    
    // Apply filters
    if (searchTerm) {
      result = result.filter(s => 
        s.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedAuthor !== 'ALL') {
      result = result.filter(s => s.dominantAuthor === selectedAuthor);
    }
    
    if (selectedSector !== 'ALL') {
      result = result.filter(s => s.sector === selectedSector);
    }
    
    // Apply sorting with null checks
    result.sort((a, b) => {
      let aVal: any = 0;
      let bVal: any = 0;
      
      if (sortBy === 'trinity_score') {
        aVal = a.strength || 0;
        bVal = b.strength || 0;
      } else if (sortBy === 'potential_return') {
        aVal = a.change || 0;
        bVal = b.change || 0;
      } else {
        aVal = a.ticker;
        bVal = b.ticker;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setFilteredSignals(result);
  }, [searchTerm, selectedAuthor, selectedSector, sortBy, sortOrder]);

  const handleExport = () => {
    const csv = [
      ['Ticker', 'Company', 'Signal', 'Trinity Score', 'Author', 'Potential Return', 'Sector'],
      ...filteredSignals.map(s => [
        s.ticker,
        s.companyName,
        s.signal,
        s.strength?.toString() || '0',
        s.dominantAuthor,
        `${s.change?.toFixed(2) || 0}%`,
        s.sector
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'top500_trinity_signals.csv';
    a.click();
  };

  const getSignalIcon = (signal: SignalType) => {
    switch(signal) {
      case 'BUY': return <TrendingUp className="h-4 w-4" />;
      case 'SELL': return <TrendingDown className="h-4 w-4" />;
      case 'HOLD': return <Minus className="h-4 w-4" />;
    }
  };

  const getAuthorColor = (author: string) => {
    switch(author) {
      case 'Lynch': return 'bg-green-100 text-green-800';
      case 'O\'Neil': return 'bg-blue-100 text-blue-800';
      case 'Graham': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">TOP 500 Trinity Signals</h1>
          <p className="text-gray-600">Complete list of analyzed stocks using the Trinity Method</p>
        </div>

        {/* Market Regime Banner */}
        {currentRegime && (
          <div className={`mb-6 p-4 rounded-lg ${
            currentRegime.overall_regime === 'BULLISH' ? 'bg-green-50 border border-green-200' :
            currentRegime.overall_regime === 'BEARISH' ? 'bg-red-50 border border-red-200' :
            'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-semibold">Current Market Regime: {currentRegime.overall_regime}</span>
              </div>
              <span className="text-sm">
                Regime Strength: {currentRegime.regime_strength?.toFixed(0) || 0}% | 
                VIX: {currentRegime.vix?.toFixed(2) || 'N/A'}
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ticker or Company..."
                  className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
              <select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value as any)}
                className="px-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Authors</option>
                <option value="Lynch">Peter Lynch</option>
                <option value="O'Neil">William O'Neil</option>
                <option value="Graham">Benjamin Graham</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                {sectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="px-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="trinity_score-desc">Trinity Score (High to Low)</option>
                <option value="trinity_score-asc">Trinity Score (Low to High)</option>
                <option value="potential_return-desc">Return (High to Low)</option>
                <option value="potential_return-asc">Return (Low to High)</option>
                <option value="ticker-asc">Ticker (A-Z)</option>
                <option value="ticker-desc">Ticker (Z-A)</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Showing {filteredSignals.length} of {signals.length} signals
            </span>
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signal
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trinity Score
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Potential Return
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sector
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSignals.map((signal) => (
                  <tr key={signal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{signal.ticker}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{signal.companyName}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        signal.signal === 'BUY' ? 'bg-green-100 text-green-800' :
                        signal.signal === 'SELL' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getSignalIcon(signal.signal)}
                        <span className="ml-1">{signal.signal}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-gray-900">
                        {signal.strength?.toFixed(1) || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getAuthorColor(signal.dominantAuthor)
                      }`}>
                        {signal.dominantAuthor}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-medium ${
                        (signal.change || 0) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(signal.change || 0) > 0 ? '+' : ''}{signal.change?.toFixed(2) || 0}%
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
        </div>
      </div>
    </div>
  );
}