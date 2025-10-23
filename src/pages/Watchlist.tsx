import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Card } from '../components/ui/Card';
import { SignalBadge } from '../components/ui/SignalBadge';
import { AuthorBadge } from '../components/ui/AuthorBadge';
import { TrinityScoreBar } from '../components/ui/TrinityScoreBar';
import { TrinityTriangleChart } from '../components/charts/TrinityTriangleChart';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { mockSignals } from '../lib/mockData';
import { Star, Download, Plus } from 'lucide-react';

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Load watchlist from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('indicium_watchlist');
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse watchlist:', error);
      }
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('indicium_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = (ticker: string) => {
    if (!watchlist.includes(ticker)) {
      setWatchlist([...watchlist, ticker]);
    }
  };

  const removeFromWatchlist = (ticker: string) => {
    setWatchlist(watchlist.filter(t => t !== ticker));
  };

  const isInWatchlist = (ticker: string) => watchlist.includes(ticker);

  // Get signals that are in the watchlist
  const watchlistSignals = mockSignals.filter(signal =>
    watchlist.includes(signal.ticker)
  );

  // Export watchlist to CSV
  const exportToCSV = () => {
    const headers = ['Ticker', 'Company', 'Signal', 'Trinity Score', 'Dominant Author', 'Price', 'Target', 'Stop Loss', 'Potential Return'];
    const rows = watchlistSignals.map(signal => [
      signal.ticker,
      signal.company,
      signal.signal,
      signal.trinityScore,
      signal.dominantAuthor,
      signal.price,
      signal.targetPrice,
      signal.stopLoss,
      signal.potentialReturn
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchlist_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Available signals to add (not in watchlist)
  const availableSignals = mockSignals.filter(signal =>
    !watchlist.includes(signal.ticker)
  ).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Watchlist</h1>
            <p className="text-slate-600">
              {watchlistSignals.length} signal{watchlistSignals.length !== 1 ? 's' : ''} in your watchlist
            </p>
          </div>
          {watchlistSignals.length > 0 && (
            <Button variant="secondary" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Empty State */}
        {watchlistSignals.length === 0 && (
          <Card className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <Star className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Your watchlist is empty
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Start building your watchlist by adding signals from the top performers below.
            </p>
          </Card>
        )}

        {/* Watchlist Signals Grid */}
        {watchlistSignals.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {watchlistSignals.map((signal) => (
              <Card
                key={signal.id}
                hover
                className="cursor-pointer relative"
              >
                {/* Remove Button */}
                <button
                  onClick={() => removeFromWatchlist(signal.ticker)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-warning/10 hover:bg-warning/20 flex items-center justify-center transition-colors"
                  title="Remove from watchlist"
                >
                  <Star className="w-5 h-5 text-warning fill-warning" />
                </button>

                {/* Header */}
                <div className="flex items-start justify-between mb-4 pr-12">
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{signal.ticker}</h3>
                      <p className="text-sm text-slate-600">{signal.company}</p>
                    </div>
                  </div>
                  <AuthorBadge author={signal.dominantAuthor} showIcon />
                </div>

                {/* Signal Badge */}
                <div className="mb-4">
                  <SignalBadge signal={signal.signal} large />
                </div>

                {/* Trinity Score */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Trinity Score
                  </label>
                  <TrinityScoreBar score={signal.trinityScore} />
                </div>

                {/* Trinity Triangle Chart */}
                <div className="flex justify-center mb-6">
                  <TrinityTriangleChart
                    lynch={signal.authorScores.lynch}
                    oneil={signal.authorScores.oneil}
                    graham={signal.authorScores.graham}
                    size="md"
                  />
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Current Price</p>
                    <p className="text-lg font-bold text-slate-900">${signal.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Target Price</p>
                    <p className="text-lg font-bold text-buy">${signal.targetPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Stop Loss</p>
                    <p className="text-lg font-bold text-sell">${signal.stopLoss.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Potential Return</p>
                    <p className="text-lg font-bold text-oneil">
                      {signal.potentialReturn > 0 ? '+' : ''}{signal.potentialReturn.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <Badge
                    variant={signal.riskProfile === 'Conservative' ? 'graham' :
                            signal.riskProfile === 'Aggressive' ? 'oneil' : 'lynch'}
                    size="sm"
                  >
                    {signal.riskProfile}
                  </Badge>
                  <span className="text-xs text-slate-600">{signal.sector}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Suggested Signals to Add */}
        {availableSignals.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Suggested Signals to Add
            </h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
              {availableSignals.map((signal) => (
                <Card
                  key={signal.id}
                  hover
                  className="cursor-pointer"
                  onClick={() => addToWatchlist(signal.ticker)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-slate-900">{signal.ticker}</h4>
                    <button
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-primary/10 flex items-center justify-center transition-colors"
                      title="Add to watchlist"
                    >
                      <Plus className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mb-3 line-clamp-1">{signal.company}</p>
                  <SignalBadge signal={signal.signal} />
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">Trinity</span>
                      <span className="text-xs font-semibold text-slate-900">
                        {signal.trinityScore}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-lynch"
                        style={{ width: signal.trinityScore + '%' }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Watchlist;
