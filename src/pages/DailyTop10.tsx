import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Card } from '../components/ui/Card';
import { SignalBadge } from '../components/ui/SignalBadge';
import { AuthorBadge } from '../components/ui/AuthorBadge';
import { TrinityScoreBar } from '../components/ui/TrinityScoreBar';
import { TrinityTriangleChart } from '../components/charts/TrinityTriangleChart';
import { WatchlistStar } from '../components/ui/WatchlistStar';
import { Badge } from '../components/ui/Badge';
import { mockSignals } from '../lib/mockData';

const DailyTop10 = () => {
  const top10 = mockSignals.slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">TOP 10 Diario</h1>
          <p className="text-slate-600">
            Actualizado {new Date().toLocaleDateString('es-ES')} • Mejores oportunidades del Trinity Method
          </p>
        </div>

        {/* Signals Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {top10.map((signal, index) => (
            <Card
              key={signal.id}
              hover
              className="cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{signal.ticker}</h3>
                    <p className="text-sm text-slate-600">{signal.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AuthorBadge author={signal.dominantAuthor} showIcon />
                  <WatchlistStar signalId={signal.id} size="md" />
                </div>
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
                  size="lg"
                />
              </div>

              {/* Author Breakdown */}
              <div className="space-y-2 mb-6 p-4 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-600 uppercase mb-2">
                  Desglose de Scores
                </p>
                {/* Lynch Score */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Lynch</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-lynch"
                        style={{ width: signal.authorScores.lynch + '%' }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 w-8 text-right">
                      {signal.authorScores.lynch}
                    </span>
                  </div>
                </div>

                {/* O'Neil Score */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">O'Neil</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-oneil"
                        style={{ width: signal.authorScores.oneil + '%' }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 w-8 text-right">
                      {signal.authorScores.oneil}
                    </span>
                  </div>
                </div>

                {/* Graham Score */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Graham</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-graham"
                        style={{ width: signal.authorScores.graham + '%' }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 w-8 text-right">
                      {signal.authorScores.graham}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Precio Actual</p>
                  <p className="text-lg font-bold text-slate-900">${signal.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Precio Objetivo</p>
                  <p className="text-lg font-bold text-buy">${signal.targetPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Stop Loss</p>
                  <p className="text-lg font-bold text-sell">${signal.stopLoss.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Retorno Potencial</p>
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
      </main>

      <Footer />
    </div>
  );
};

export default DailyTop10;
