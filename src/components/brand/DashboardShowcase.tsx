import React from 'react';

const DashboardShowcase: React.FC = () => {
  return (
    <div className="p-8 bg-neutral-50 rounded-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard Principal - Rediseño Oficial</h2>
        <p className="text-neutral-600">Layout profesional con Hero Section, KPI Cards y estructura mejorada</p>
      </div>
      
      {/* Especificaciones del nuevo diseño */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">Mejoras Implementadas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hero Section */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Hero Section con KPI Cards</h4>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-warning-500 rounded"></div>
                <span>Régimen de Mercado (NEUTRAL)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success-500 rounded"></div>
                <span>% BUY Hoy (12.5%) con barra de progreso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded"></div>
                <span>Señales Activas (1,132 +45)</span>
              </div>
            </div>
          </div>

          {/* Layout Structure */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Estructura de Layout</h4>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neutral-400 rounded"></div>
                <span>Background gradient profesional</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neutral-400 rounded"></div>
                <span>Container max-width 7xl centrado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neutral-400 rounded"></div>
                <span>Padding responsive (px-4 sm:px-6 lg:px-8)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Características técnicas */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <h4 className="font-semibold text-neutral-800 mb-3">Características Técnicas</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600">
            <div>
              <h5 className="font-medium text-neutral-700 mb-2">KPI Cards</h5>
              <ul className="space-y-1">
                <li>• Glassmorphism (bg-white/80)</li>
                <li>• Iconos SVG personalizados</li>
                <li>• Hover effects suaves</li>
                <li>• Colores oficiales aplicados</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-neutral-700 mb-2">Filtros Rápidos</h5>
              <ul className="space-y-1">
                <li>• Botones Todos/BUY/Lynch/O'Neil/Graham</li>
                <li>• Hover states con colores brand</li>
                <li>• Transiciones suaves</li>
                <li>• Responsive wrap</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-neutral-700 mb-2">Animaciones</h5>
              <ul className="space-y-1">
                <li>• Fade-in escalonado (50ms delay)</li>
                <li>• Pulse animation en status</li>
                <li>• Hover scale en cards</li>
                <li>• Transiciones 300ms</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Estados y UX */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <h4 className="font-semibold text-neutral-800 mb-3">Estados y UX</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-600">
            <div>
              <h5 className="font-medium text-neutral-700 mb-2">Estados de Carga</h5>
              <ul className="space-y-1">
                <li>• Loading spinner centrado</li>
                <li>• Estado vacío con emoji y mensaje</li>
                <li>• Mensajes informativos</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-neutral-700 mb-2">Responsive Design</h5>
              <ul className="space-y-1">
                <li>• Grid adaptativo (1/2/3 columnas)</li>
                <li>• Padding responsive</li>
                <li>• Botones que se adaptan</li>
                <li>• Texto escalable</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <h4 className="font-semibold text-neutral-800 mb-3">Botones de Acción</h4>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors duration-200">
              Ver TOP 500 →
            </button>
            <button className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-primary-500 hover:bg-primary-50 rounded-lg text-sm font-medium text-neutral-700 hover:text-primary-700 transition-all duration-200">
              Todos
            </button>
            <button className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-success-500 hover:bg-success-50 rounded-lg text-sm font-medium text-neutral-700 hover:text-success-700 transition-all duration-200">
              Solo BUY
            </button>
            <button className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-primary-500 hover:bg-primary-50 rounded-lg text-sm font-medium text-neutral-700 hover:text-primary-700 transition-all duration-200">
              Lynch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardShowcase;
