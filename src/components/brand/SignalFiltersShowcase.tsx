import React from 'react';

const SignalFiltersShowcase: React.FC = () => {
  return (
    <div className="p-8 bg-neutral-50 rounded-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">Sistema de Filtros Avanzados</h2>
        <p className="text-neutral-600">Filtrado dinámico en tiempo real para las 20 señales Trinity</p>
      </div>
      
      {/* Características del sistema */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200 mb-6">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">🔍 Características del Sistema</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Filtros Disponibles */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Filtros Disponibles</h4>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded"></div>
                <span>Búsqueda por ticker/empresa (case-insensitive)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success-500 rounded"></div>
                <span>Signal Type: BUY, HOLD, SELL (multi-select)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-info-500 rounded"></div>
                <span>Autor Dominante: Lynch, O'Neil, Graham</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-warning-500 rounded"></div>
                <span>Trinity Score mínimo (range slider 0-100)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neutral-500 rounded"></div>
                <span>Risk Profile: Conservative, Moderate, Aggressive</span>
              </div>
            </div>
          </div>

          {/* Funcionalidades */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Funcionalidades</h4>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded"></div>
                <span>Filtrado en tiempo real con useMemo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success-500 rounded"></div>
                <span>Contador dinámico "X de Y señales"</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-info-500 rounded"></div>
                <span>Botón "Limpiar filtros" funcional</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-warning-500 rounded"></div>
                <span>Estado vacío con mensaje amigable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neutral-500 rounded"></div>
                <span>Diseño responsive (mobile/tablet/desktop)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ejemplos de uso */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200 mb-6">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">💡 Ejemplos de Uso</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Casos de uso comunes */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Casos de Uso Comunes</h4>
            <div className="space-y-3">
              <div className="p-3 bg-neutral-50 rounded-lg">
                <div className="font-medium text-neutral-700 mb-1">Solo señales BUY</div>
                <div className="text-sm text-neutral-600">Filtrar por Signal Type: BUY</div>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <div className="font-medium text-neutral-700 mb-1">Señales de Lynch</div>
                <div className="text-sm text-neutral-600">Filtrar por Autor: Lynch</div>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <div className="font-medium text-neutral-700 mb-1">Trinity Score > 80</div>
                <div className="text-sm text-neutral-600">Usar slider para establecer mínimo</div>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <div className="font-medium text-neutral-700 mb-1">Buscar Apple</div>
                <div className="text-sm text-neutral-600">Escribir "AAPL" o "Apple" en búsqueda</div>
              </div>
            </div>
          </div>

          {/* Combinaciones avanzadas */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Combinaciones Avanzadas</h4>
            <div className="space-y-3">
              <div className="p-3 bg-primary-50 rounded-lg">
                <div className="font-medium text-primary-700 mb-1">BUY + Lynch + Score > 75</div>
                <div className="text-sm text-primary-600">Señales de crecimiento sólido</div>
              </div>
              <div className="p-3 bg-success-50 rounded-lg">
                <div className="font-medium text-success-700 mb-1">Conservative + Graham</div>
                <div className="text-sm text-success-600">Inversiones defensivas</div>
              </div>
              <div className="p-3 bg-warning-50 rounded-lg">
                <div className="font-medium text-warning-700 mb-1">O'Neil + Aggressive</div>
                <div className="text-sm text-warning-600">Momentum trading</div>
              </div>
              <div className="p-3 bg-info-50 rounded-lg">
                <div className="font-medium text-info-700 mb-1">Technology + Score > 70</div>
                <div className="text-sm text-info-600">Sector tech con buen score</div>
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
              <li>• useMemo para filtrado optimizado</li>
              <li>• Filtros acumulativos (AND logic)</li>
              <li>• Transiciones suaves (300ms)</li>
              <li>• Sin re-renders innecesarios</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-neutral-700 mb-2">UX/UI</h5>
            <ul className="space-y-1">
              <li>• Colores brand aplicados</li>
              <li>• Iconos Lucide React</li>
              <li>• Estados hover/focus</li>
              <li>• Responsive design</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-neutral-700 mb-2">Funcionalidad</h5>
            <ul className="space-y-1">
              <li>• Arrays vacíos = sin filtro</li>
              <li>• Search case-insensitive</li>
              <li>• Reset completo funcional</li>
              <li>• Contador dinámico</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalFiltersShowcase;
