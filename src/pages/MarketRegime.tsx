import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { mockMarketRegime } from '../lib/mockData';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MarketRegime = () => {
  const { current, vix, breadth, yieldCurve, dollarStrength, commodities, weights } = mockMarketRegime;

  const getRegimeColor = () => {
    if (current === 'BULLISH') return 'bg-buy';
    if (current === 'BEARISH') return 'bg-sell';
    return 'bg-hold';
  };

  const getRegimeIcon = () => {
    if (current === 'BULLISH') return <TrendingUp className="w-8 h-8" />;
    if (current === 'BEARISH') return <TrendingDown className="w-8 h-8" />;
    return <Minus className="w-8 h-8" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Análisis de Régimen de Mercado</h1>
          <p className="text-slate-600">Condiciones actuales del mercado y tendencias históricas</p>
        </div>

        {/* Current Regime Card */}
        <Card className="mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className={'w-24 h-24 rounded-full flex items-center justify-center text-white ' + getRegimeColor()}>
              {getRegimeIcon()}
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-600 mb-1">Régimen de Mercado Actual</p>
              <h2 className="text-4xl font-bold text-slate-900 mb-2">{current}</h2>
              <p className="text-slate-600">
                VIX: <span className="font-semibold">{vix}</span> |
                Amplitud: <span className="font-semibold">{breadth}%</span>
              </p>
            </div>
          </div>

          {/* Trinity Weights */}
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Pesos del Trinity Method</h3>
            <p className="text-sm text-slate-600 mb-4">
              Las condiciones actuales del mercado determinan el peso de cada estrategia
            </p>
            <div className="space-y-3">
              {/* Lynch Weight */}
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-slate-700">Lynch</span>
                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-lynch"
                    style={{ width: weights.lynch + '%' }}
                  />
                </div>
                <Badge variant="lynch" size="sm">{weights.lynch}%</Badge>
              </div>

              {/* O'Neil Weight */}
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-slate-700">O'Neil</span>
                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-oneil"
                    style={{ width: weights.oneil + '%' }}
                  />
                </div>
                <Badge variant="oneil" size="sm">{weights.oneil}%</Badge>
              </div>

              {/* Graham Weight */}
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-slate-700">Graham</span>
                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-graham"
                    style={{ width: weights.graham + '%' }}
                  />
                </div>
                <Badge variant="graham" size="sm">{weights.graham}%</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-slate-900">Índice de Miedo VIX</h3>
              <TrendingDown className="w-5 h-5 text-buy" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{vix}</p>
            <p className="text-sm text-slate-600">Índice de miedo por debajo de 20 indica baja volatilidad</p>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-slate-900">Amplitud de Mercado</h3>
              <TrendingUp className="w-5 h-5 text-buy" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{breadth}%</p>
            <p className="text-sm text-slate-600">Porcentaje de acciones sobre MA de 50 días</p>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-slate-900">Curva de Rendimiento</h3>
              <Minus className="w-5 h-5 text-hold" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{yieldCurve}</p>
            <p className="text-sm text-slate-600">Diferencial 10A-2A en puntos base</p>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-slate-900">Índice Dólar</h3>
              <TrendingUp className="w-5 h-5 text-buy" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{dollarStrength}</p>
            <p className="text-sm text-slate-600">Índice DXY mostrando fortaleza del dólar</p>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-slate-900">Commodities</h3>
              <TrendingDown className="w-5 h-5 text-sell" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{commodities}</p>
            <p className="text-sm text-slate-600">Rendimiento del índice CRB</p>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MarketRegime;
