import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Card } from '../components/ui/Card';
import { SignalBadge } from '../components/ui/SignalBadge';
import { AuthorBadge } from '../components/ui/AuthorBadge';
import { TrinityScoreBar } from '../components/ui/TrinityScoreBar';
import { TrinityTriangleChart } from '../components/charts/TrinityTriangleChart';
import { WatchlistStar } from '../components/ui/WatchlistStar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { mockSignals } from '../lib/mockData';
import { Star, Download, Info } from 'lucide-react';

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Load watchlist from localStorage on mount
  useEffect(() => {
    console.log('[Watchlist] Component mounted');

    const loadWatchlist = () => {
      console.log('[Watchlist] Loading watchlist from localStorage...');
      const saved = localStorage.getItem('indicium_watchlist');
      console.log('[Watchlist] Raw localStorage value:', saved);

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('[Watchlist] Parsed watchlist:', parsed);
          console.log('[Watchlist] Number of signals:', parsed.length);
          setWatchlist(parsed);
        } catch (error) {
          console.error('[Watchlist] Failed to parse watchlist:', error);
        }
      } else {
        console.log('[Watchlist] No watchlist found in localStorage');
      }
    };

    loadWatchlist();

    // Listen for updates from other components
    const handleUpdate = () => {
      console.log('[Watchlist] ========== EVENT RECEIVED ==========');
      console.log('[Watchlist] watchlistUpdated event triggered, reloading...');
      loadWatchlist();
    };

    window.addEventListener('watchlistUpdated', handleUpdate);
    console.log('[Watchlist] Event listener registered');
    return () => {
      console.log('[Watchlist] Cleaning up event listener');
      window.removeEventListener('watchlistUpdated', handleUpdate);
    };
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    if (watchlist.length > 0) {
      console.log('[Watchlist] State changed, saving to localStorage:', watchlist);
      localStorage.setItem('indicium_watchlist', JSON.stringify(watchlist));
    }
  }, [watchlist]);

  const addToWatchlist = (signalId: string) => {
    console.log('[Watchlist] addToWatchlist called with:', signalId);
    if (!watchlist.includes(signalId)) {
      setWatchlist([...watchlist, signalId]);
    }
  };

  const removeFromWatchlist = (signalId: string) => {
    console.log('[Watchlist] removeFromWatchlist called with:', signalId);
    setWatchlist(watchlist.filter(id => id !== signalId));
  };

  const isInWatchlist = (signalId: string) => watchlist.includes(signalId);

  // Manual ticker add handler
  const handleManualAdd = () => {
    console.log('[Watchlist] handleManualAdd called with input:', manualInput);
    setAddError(null);

    // Parse input (split by comma, trim whitespace, uppercase)
    const tickers = manualInput
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0);

    console.log('[Watchlist] Parsed tickers:', tickers);

    if (tickers.length === 0) {
      setAddError('Por favor ingresa al menos un ticker');
      return;
    }

    // Find signals that match the tickers
    const signalsToAdd = mockSignals.filter(signal =>
      tickers.includes(signal.ticker.toUpperCase())
    );

    console.log('[Watchlist] Signals found:', signalsToAdd.length, 'out of', tickers.length);

    if (signalsToAdd.length === 0) {
      setAddError(`No se encontraron señales para: ${tickers.join(', ')}`);
      return;
    }

    // Get current watchlist
    const saved = localStorage.getItem('indicium_watchlist');
    let list: string[] = saved ? JSON.parse(saved) : [];

    // Add new signals (avoid duplicates)
    let addedCount = 0;
    signalsToAdd.forEach(signal => {
      if (!list.includes(signal.id)) {
        if (list.length >= 50) {
          setAddError('Has alcanzado el límite de 50 señales');
          return;
        }
        list.push(signal.id);
        addedCount++;
        console.log('[Watchlist] Added signal:', signal.id, signal.ticker);
      } else {
        console.log('[Watchlist] Signal already in watchlist:', signal.id, signal.ticker);
      }
    });

    // Save and update
    localStorage.setItem('indicium_watchlist', JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('watchlistUpdated'));
    console.log('[Watchlist] Saved updated watchlist, dispatched event');

    // Clear input and show feedback
    if (addedCount > 0) {
      setManualInput('');

      // Check if any tickers were not found
      const notFound = tickers.filter(t =>
        !signalsToAdd.some(s => s.ticker.toUpperCase() === t)
      );

      if (notFound.length > 0) {
        setAddError(`✅ Agregados ${addedCount} ticker(s). No encontrados: ${notFound.join(', ')}`);
      } else {
        setAddError(`✅ Agregados ${addedCount} ticker(s) exitosamente`);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setAddError(null), 3000);
    }
  };

  // CRITICAL FIX: Filter by signal.id instead of signal.ticker
  console.log('[Watchlist] Filtering signals... watchlist contains:', watchlist);
  const watchlistSignals = mockSignals.filter(signal => {
    const inList = watchlist.includes(signal.id);
    if (inList) {
      console.log('[Watchlist] Signal', signal.id, '(', signal.ticker, ') is in watchlist');
    }
    return inList;
  });
  console.log('[Watchlist] Found', watchlistSignals.length, 'signals in watchlist');

  // Export watchlist to CSV
  const exportToCSV = () => {
    const headers = ['Ticker', 'Empresa', 'Señal', 'Trinity Score', 'Autor', 'Precio', 'Objetivo', 'Stop Loss', 'Retorno Potencial'];
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

  // Available signals to add (not in watchlist) - FIXED: use signal.id
  const availableSignals = mockSignals.filter(signal =>
    !watchlist.includes(signal.id)
  ).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Mi Watchlist</h1>
            <p className="text-slate-600">
              {watchlistSignals.length} señal{watchlistSignals.length !== 1 ? 'es' : ''} guardada{watchlistSignals.length !== 1 ? 's' : ''} en la watchlist
            </p>
          </div>
          {watchlistSignals.length > 0 && (
            <Button variant="secondary" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          )}
        </div>

        {/* Instructions Card */}
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                ¿Cómo agregar señales a la watchlist?
              </h3>
              <ol className="text-sm text-slate-700 space-y-1 list-decimal list-inside">
                <li>Ve a cualquier página con señales (Dashboard, TOP 500, TOP 10 Diario)</li>
                <li>Encuentra la señal que te interesa</li>
                <li>Haz clic en el icono de estrella ★ junto a la señal</li>
                <li>La señal aparecerá automáticamente aquí en Watchlist</li>
              </ol>
              <p className="text-sm text-slate-600 mt-3">
                💡 <strong>Tip:</strong> Puedes guardar hasta 50 señales en tu watchlist
              </p>
            </div>
          </div>
        </Card>

        {/* Manual Ticker Input Section */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Agregar Tickers Manualmente
          </h3>

          <div className="space-y-3">
            {/* Input field */}
            <div>
              <label htmlFor="manual-ticker-input" className="block text-sm font-medium text-slate-700 mb-2">
                Ingresa ticker(s) separados por comas
              </label>
              <input
                id="manual-ticker-input"
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualAdd();
                  }
                }}
                placeholder="Ej: AAPL, MSFT, GOOGL"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">
                💡 Puedes agregar múltiples tickers separándolos con comas
              </p>
            </div>

            {/* Add button */}
            <button
              onClick={handleManualAdd}
              disabled={!manualInput.trim()}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Agregar a Watchlist
            </button>

            {/* Error/feedback message */}
            {addError && (
              <div className={`p-3 rounded-lg text-sm ${
                addError.includes('✅')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                {addError}
              </div>
            )}
          </div>
        </Card>

        {/* Empty State */}
        {watchlistSignals.length === 0 && (
          <Card className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <Star className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Tu watchlist está vacía
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Agrega señales a tu watchlist desde las páginas Dashboard, TOP 500 o TOP 10 Diario
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
                  title="Quitar de watchlist"
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

        {/* Señales Sugeridas para Agregar */}
        {availableSignals.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Señales Sugeridas para Agregar
            </h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
              {availableSignals.map((signal) => (
                <Card
                  key={signal.id}
                  hover
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-slate-900">{signal.ticker}</h4>
                    <WatchlistStar signalId={signal.id} size="sm" />
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
