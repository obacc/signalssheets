import React from 'react';

const MockDataDistributionReport: React.FC = () => {
  return (
    <div className="p-8 bg-neutral-50 rounded-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">Mock Data - 20 Señales Trinity Balanceadas</h2>
        <p className="text-neutral-600">Análisis completo de distribución y diversificación</p>
      </div>
      
      {/* Resumen Ejecutivo */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200 mb-6">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">📊 Resumen Ejecutivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">20</div>
            <div className="text-sm text-neutral-600">Señales Totales</div>
          </div>
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="text-2xl font-bold text-success-600">11</div>
            <div className="text-sm text-neutral-600">Sectores GICS</div>
          </div>
          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <div className="text-2xl font-bold text-warning-600">3</div>
            <div className="text-sm text-neutral-600">Autores Trinity</div>
          </div>
        </div>
      </div>

      {/* Distribución por Sector */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200 mb-6">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">🏢 Distribución por Sector GICS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <span className="font-medium text-neutral-700">Technology</span>
            <span className="text-lg font-bold text-primary-600">4</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <span className="font-medium text-neutral-700">Healthcare</span>
            <span className="text-lg font-bold text-primary-600">2</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <span className="font-medium text-neutral-700">Financials</span>
            <span className="text-lg font-bold text-primary-600">2</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <span className="font-medium text-neutral-700">Communication</span>
            <span className="text-lg font-bold text-primary-600">2</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <span className="font-medium text-neutral-700">Consumer Cyclical</span>
            <span className="text-lg font-bold text-primary-600">2</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <span className="font-medium text-neutral-700">Industrials</span>
            <span className="text-lg font-bold text-primary-600">2</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <span className="font-medium text-neutral-700">Utilities</span>
            <span className="text-lg font-bold text-primary-600">2</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <span className="font-medium text-neutral-700">Consumer Defensive</span>
            <span className="text-lg font-bold text-primary-600">1</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <span className="font-medium text-neutral-700">Energy</span>
            <span className="text-lg font-bold text-primary-600">1</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <span className="font-medium text-neutral-700">Real Estate</span>
            <span className="text-lg font-bold text-primary-600">1</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <span className="font-medium text-neutral-700">Basic Materials</span>
            <span className="text-lg font-bold text-primary-600">1</span>
          </div>
        </div>
      </div>

      {/* Distribución por Signal Type */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200 mb-6">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">📈 Distribución por Signal Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-success-50 rounded-lg border border-success-200">
            <div className="text-3xl font-bold text-success-600 mb-2">12</div>
            <div className="text-lg font-semibold text-success-700 mb-1">BUY</div>
            <div className="text-sm text-success-600">60% • Objetivo: 60%</div>
            <div className="w-full bg-success-200 rounded-full h-2 mt-2">
              <div className="bg-success-500 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
          <div className="text-center p-4 bg-warning-50 rounded-lg border border-warning-200">
            <div className="text-3xl font-bold text-warning-600 mb-2">6</div>
            <div className="text-lg font-semibold text-warning-700 mb-1">HOLD</div>
            <div className="text-sm text-warning-600">30% • Objetivo: 30%</div>
            <div className="w-full bg-warning-200 rounded-full h-2 mt-2">
              <div className="bg-warning-500 h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
          </div>
          <div className="text-center p-4 bg-danger-50 rounded-lg border border-danger-200">
            <div className="text-3xl font-bold text-danger-600 mb-2">2</div>
            <div className="text-lg font-semibold text-danger-700 mb-1">SELL</div>
            <div className="text-sm text-danger-600">10% • Objetivo: 10%</div>
            <div className="w-full bg-danger-200 rounded-full h-2 mt-2">
              <div className="bg-danger-500 h-2 rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución por Autor Dominante */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200 mb-6">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">👥 Distribución por Autor Dominante</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-success-50 rounded-lg border border-success-200">
            <div className="text-3xl font-bold text-success-600 mb-2">7</div>
            <div className="text-lg font-semibold text-success-700 mb-1">Lynch</div>
            <div className="text-sm text-success-600">35% • Growth at Reasonable Price</div>
            <div className="w-full bg-success-200 rounded-full h-2 mt-2">
              <div className="bg-success-500 h-2 rounded-full" style={{ width: '35%' }}></div>
            </div>
          </div>
          <div className="text-center p-4 bg-primary-50 rounded-lg border border-primary-200">
            <div className="text-3xl font-bold text-primary-600 mb-2">6</div>
            <div className="text-lg font-semibold text-primary-700 mb-1">O'Neil</div>
            <div className="text-sm text-primary-600">30% • CAN SLIM Momentum</div>
            <div className="w-full bg-primary-200 rounded-full h-2 mt-2">
              <div className="bg-primary-500 h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
          </div>
          <div className="text-center p-4 bg-info-50 rounded-lg border border-info-200">
            <div className="text-3xl font-bold text-info-600 mb-2">7</div>
            <div className="text-lg font-semibold text-info-700 mb-1">Graham</div>
            <div className="text-sm text-info-600">35% • Value Investing</div>
            <div className="w-full bg-info-200 rounded-full h-2 mt-2">
              <div className="bg-info-500 h-2 rounded-full" style={{ width: '35%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución por Trinity Score Ranges */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200 mb-6">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">🎯 Distribución por Trinity Score Ranges</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg border border-success-200">
            <div>
              <div className="font-semibold text-success-700">Excelente (80-95)</div>
              <div className="text-sm text-success-600">Objetivo: 25%</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-success-600">5</div>
              <div className="text-sm text-success-600">25% ✅</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-success-100 rounded-lg border border-success-300">
            <div>
              <div className="font-semibold text-success-700">Bueno (70-79)</div>
              <div className="text-sm text-success-600">Objetivo: 40%</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-success-600">8</div>
              <div className="text-sm text-success-600">40% ✅</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg border border-warning-200">
            <div>
              <div className="font-semibold text-warning-700">Neutral (60-69)</div>
              <div className="text-sm text-warning-600">Objetivo: 20%</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-warning-600">4</div>
              <div className="text-sm text-warning-600">20% ✅</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-warning-100 rounded-lg border border-warning-300">
            <div>
              <div className="font-semibold text-warning-700">Precaución (50-59)</div>
              <div className="text-sm text-warning-600">Objetivo: 10%</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-warning-600">2</div>
              <div className="text-sm text-warning-600">10% ✅</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-danger-50 rounded-lg border border-danger-200">
            <div>
              <div className="font-semibold text-danger-700">Evitar (<50)</div>
              <div className="text-sm text-danger-600">Objetivo: 5%</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-danger-600">1</div>
              <div className="text-sm text-danger-600">5% ✅</div>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución por Risk Profile y Market Cap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">⚖️ Risk Profile</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <span className="font-medium text-neutral-700">Conservative</span>
              <span className="text-lg font-bold text-neutral-600">6 (30%)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <span className="font-medium text-neutral-700">Moderate</span>
              <span className="text-lg font-bold text-neutral-600">10 (50%)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <span className="font-medium text-neutral-700">Aggressive</span>
              <span className="text-lg font-bold text-neutral-600">4 (20%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">💰 Market Cap</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <span className="font-medium text-neutral-700">Large Cap (>$200B)</span>
              <span className="text-lg font-bold text-neutral-600">10 (50%)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <span className="font-medium text-neutral-700">Mid Cap ($10B-$200B)</span>
              <span className="text-lg font-bold text-neutral-600">7 (35%)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <span className="font-medium text-neutral-700">Small Cap (<$10B)</span>
              <span className="text-lg font-bold text-neutral-600">3 (15%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Señales */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200 mt-6">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">📋 Lista Completa de Señales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { ticker: "NVDA", sector: "Technology", signal: "BUY", score: 85.0, author: "Lynch" },
            { ticker: "GOOGL", sector: "Communication", signal: "BUY", score: 79.3, author: "Lynch" },
            { ticker: "LIN", sector: "Materials", signal: "BUY", score: 79.0, author: "Graham" },
            { ticker: "MSFT", sector: "Technology", signal: "BUY", score: 78.7, author: "O'Neil" },
            { ticker: "AAPL", sector: "Technology", signal: "BUY", score: 78.3, author: "Lynch" },
            { ticker: "JPM", sector: "Financials", signal: "BUY", score: 78.3, author: "Graham" },
            { ticker: "NEE", sector: "Utilities", signal: "BUY", score: 77.0, author: "Graham" },
            { ticker: "UNH", sector: "Healthcare", signal: "BUY", score: 77.3, author: "Graham" },
            { ticker: "PLD", sector: "Real Estate", signal: "BUY", score: 75.0, author: "Graham" },
            { ticker: "TSLA", sector: "Consumer Cyclical", signal: "BUY", score: 74.0, author: "O'Neil" },
            { ticker: "SNOW", sector: "Technology", signal: "BUY", score: 71.7, author: "O'Neil" },
            { ticker: "AMZN", sector: "Consumer Cyclical", signal: "BUY", score: 76.7, author: "Lynch" },
            { ticker: "DUK", sector: "Utilities", signal: "HOLD", score: 67.3, author: "Graham" },
            { ticker: "LMT", sector: "Industrials", signal: "HOLD", score: 67.0, author: "Graham" },
            { ticker: "CAT", sector: "Industrials", signal: "HOLD", score: 68.3, author: "Graham" },
            { ticker: "KO", sector: "Consumer Defensive", signal: "HOLD", score: 66.0, author: "Graham" },
            { ticker: "XOM", sector: "Energy", signal: "HOLD", score: 58.3, author: "Graham" },
            { ticker: "JNJ", sector: "Healthcare", signal: "BUY", score: 73.7, author: "Graham" },
            { ticker: "BAC", sector: "Financials", signal: "SELL", score: 45.0, author: "Graham" },
            { ticker: "NFLX", sector: "Communication", signal: "SELL", score: 41.7, author: "Graham" }
          ].map((signal, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="font-bold text-neutral-900">{signal.ticker}</span>
                <span className="text-sm text-neutral-600">({signal.sector})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  signal.signal === 'BUY' ? 'bg-success-100 text-success-700' :
                  signal.signal === 'HOLD' ? 'bg-warning-100 text-warning-700' :
                  'bg-danger-100 text-danger-700'
                }`}>
                  {signal.signal}
                </span>
                <span className="text-sm font-bold text-neutral-700">{signal.score}</span>
                <span className="text-xs text-neutral-500">{signal.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MockDataDistributionReport;
