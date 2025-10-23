import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SignalBadge } from '../components/ui/SignalBadge';
import { AuthorBadge } from '../components/ui/AuthorBadge';
import { TrinityScoreBar } from '../components/ui/TrinityScoreBar';
import { TrinityTriangleChart } from '../components/charts/TrinityTriangleChart';
import { mockKPIs, mockMarketRegime, mockSignals } from '../lib/mockData';
import { TrendingUp, Activity, BarChart3 } from 'lucide-react';

const Dashboard = () => {
  const top10 = mockSignals.slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Trinity Method Trading Signals</p>
        </div>

        {/* Market Regime Banner */}
        <Card className="mb-8 bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 rounded-full bg-hold flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {mockMarketRegime.current === 'NEUTRAL' ? '⏸️' :
                   mockMarketRegime.current === 'BULLISH' ? '📈' : '📉'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Current Market Regime: <span className="text-hold">{mockMarketRegime.current}</span>
                </h2>
                <p className="text-sm text-slate-600">
                  VIX: {mockMarketRegime.vix} | Breadth: {mockMarketRegime.breadth}%
                </p>
                <div className="flex gap-3 mt-2">
                  <Badge variant="lynch" size="sm">{mockMarketRegime.weights.lynch}%</Badge>
                  <Badge variant="oneil" size="sm">{mockMarketRegime.weights.oneil}%</Badge>
                  <Badge variant="graham" size="sm">{mockMarketRegime.weights.graham}%</Badge>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <TrinityTriangleChart
                lynch={mockMarketRegime.weights.lynch}
                oneil={mockMarketRegime.weights.oneil}
                graham={mockMarketRegime.weights.graham}
                size="md"
              />
            </div>
          </div>
        </Card>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Signals</p>
                <p className="text-3xl font-bold text-slate-900">{mockKPIs.totalSignals}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-sm text-slate-600">Active signals in portfolio</p>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Buy Signals</p>
                <p className="text-3xl font-bold text-buy">{mockKPIs.buySignals}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-buy/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-buy" />
              </div>
            </div>
            <p className="text-sm text-slate-600">Positive momentum opportunities</p>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Avg Trinity Score</p>
                <p className="text-3xl font-bold text-slate-900">{mockKPIs.avgTrinityScore}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-oneil/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-oneil" />
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Top: <span className="font-semibold">{mockKPIs.topGainer.ticker}</span> +{mockKPIs.topGainer.change}%
            </p>
          </Card>
        </div>

        {/* TOP 10 Signals Table */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Daily TOP 10 Signals</h2>
            <a
              href="/daily-top10"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Ticker</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Company</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Signal</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Trinity Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Author</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Price</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Target</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((signal) => (
                  <tr key={signal.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{signal.ticker}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {signal.company}
                    </td>
                    <td className="py-3 px-4">
                      <SignalBadge signal={signal.signal} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-32">
                          <TrinityScoreBar score={signal.trinityScore} showLabel={false} />
                        </div>
                        <span className="text-xs text-slate-600">{signal.trinityScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <AuthorBadge author={signal.dominantAuthor} />
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      ${signal.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-buy">
                      ${signal.targetPrice.toFixed(2)}
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

export default Dashboard;
