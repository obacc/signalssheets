import React from 'react';

const StatsOverviewShowcase: React.FC = () => {
  return (
    <div className="p-8 bg-neutral-50 rounded-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard de Estadísticas Trinity Method</h2>
        <p className="text-neutral-600">Análisis agregado y visualizaciones de las señales Trinity</p>
      </div>
      
      {/* Características del dashboard */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200 mb-6">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">📊 Características del Dashboard</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* KPIs */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">KPIs Principales</h4>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded"></div>
                <span>Trinity Score Promedio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success-500 rounded"></div>
                <span>Retorno Esperado Promedio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-info-500 rounded"></div>
                <span>Confianza Promedio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neutral-500 rounded"></div>
                <span>Total de Señales</span>
              </div>
            </div>
          </div>

          {/* Visualizaciones */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Visualizaciones</h4>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success-500 rounded"></div>
                <span>Pie Chart: Distribución por Signal Type</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded"></div>
                <span>Pie Chart: Distribución por Autor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-warning-500 rounded"></div>
                <span>Bar Chart: Distribución por Sector</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-info-500 rounded"></div>
                <span>Lista: Top 5 Trinity Scores</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ejemplos de métricas */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200 mb-6">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">💡 Ejemplos de Métricas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Distribución por Signal Type */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Distribución por Signal Type</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg border border-success-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                  <span className="font-medium text-success-700">BUY</span>
                </div>
                <span className="font-bold text-success-600">12 señales (60%)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg border border-warning-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                  <span className="font-medium text-warning-700">HOLD</span>
                </div>
                <span className="font-bold text-warning-600">6 señales (30%)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-danger-50 rounded-lg border border-danger-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-danger-500 rounded-full"></div>
                  <span className="font-medium text-danger-700">SELL</span>
                </div>
                <span className="font-bold text-danger-600">2 señales (10%)</span>
              </div>
            </div>
          </div>

          {/* Top 5 Trinity Scores */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Top 5 Trinity Scores</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xs">1</div>
                  <span className="font-medium text-neutral-700">NVDA</span>
                </div>
                <span className="font-bold text-success-600">85.0</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xs">2</div>
                  <span className="font-medium text-neutral-700">GOOGL</span>
                </div>
                <span className="font-bold text-success-600">79.3</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xs">3</div>
                  <span className="font-medium text-neutral-700">LIN</span>
                </div>
                <span className="font-bold text-success-600">79.0</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xs">4</div>
                  <span className="font-medium text-neutral-700">MSFT</span>
                </div>
                <span className="font-bold text-success-600">78.7</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xs">5</div>
                  <span className="font-medium text-neutral-700">AAPL</span>
                </div>
                <span className="font-bold text-success-600">78.3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Especificaciones técnicas */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">⚙️ Especificaciones Técnicas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600">
          <div>
            <h5 className="font-medium text-neutral-700 mb-2">Performance</h5>
            <ul className="space-y-1">
              <li>• useMemo para cálculos optimizados</li>
              <li>• ResponsiveContainer para gráficos</li>
              <li>• Datos calculados dinámicamente</li>
              <li>• Manejo de división por cero</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-neutral-700 mb-2">Visualizaciones</h5>
            <ul className="space-y-1">
              <li>• Recharts para gráficos</li>
              <li>• Pie Charts con colores brand</li>
              <li>• Bar Chart horizontal</li>
              <li>• Tooltips personalizados</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-neutral-700 mb-2">Funcionalidad</h5>
            <ul className="space-y-1">
              <li>• Datos filtrados dinámicamente</li>
              <li>• Estado vacío con mensaje</li>
              <li>• Ordenamiento automático</li>
              <li>• Colores consistentes</li>
            </ul>
          </div>
        </div>

        {/* Librerías utilizadas */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <h4 className="font-semibold text-neutral-800 mb-3">Librerías Utilizadas</h4>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">Recharts</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">Lucide React</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">Tailwind CSS</span>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">React Hooks</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverviewShowcase;
