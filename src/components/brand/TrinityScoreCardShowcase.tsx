import React from 'react';
import TrinityScoreCard from './TrinityScoreCard';

const TrinityScoreCardShowcase: React.FC = () => {
  // Datos de ejemplo para mostrar diferentes rangos de scores
  const showcaseData = [
    {
      id: "SHOWCASE-001",
      ticker: "NVDA",
      companyName: "NVIDIA Corporation",
      lynchScore: 92,
      oneilScore: 95,
      grahamScore: 68,
      trinityScore: 85.0,
      dominantAuthor: "Lynch" as const,
    },
    {
      id: "SHOWCASE-002", 
      ticker: "BAC",
      companyName: "Bank of America Corporation",
      lynchScore: 45,
      oneilScore: 38,
      grahamScore: 52,
      trinityScore: 45.0,
      dominantAuthor: "Graham" as const,
    },
    {
      id: "SHOWCASE-003",
      ticker: "CAT",
      companyName: "Caterpillar Inc.",
      lynchScore: 68,
      oneilScore: 62,
      grahamScore: 75,
      trinityScore: 68.3,
      dominantAuthor: "Graham" as const,
    }
  ];

  return (
    <div className="p-8 bg-neutral-50 rounded-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">TrinityScoreCard - Branding Oficial</h2>
        <p className="text-neutral-600">Componente actualizado con paleta de colores oficial de Indicium Signals</p>
      </div>
      
      {/* Grid de demostración */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {showcaseData.map((signal) => (
          <TrinityScoreCard
            key={signal.id}
            lynchScore={signal.lynchScore}
            oneilScore={signal.oneilScore}
            grahamScore={signal.grahamScore}
            trinityScore={signal.trinityScore}
            dominantAuthor={signal.dominantAuthor}
            ticker={signal.ticker}
            companyName={signal.companyName}
          />
        ))}
      </div>

      {/* Especificaciones del nuevo diseño */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">Mejoras Implementadas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Color Coding */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Color Coding Trinity Score</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-success-500 rounded"></div>
                <span className="text-sm text-neutral-600">80-100: EXCELENTE (Verde)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-success-400 rounded"></div>
                <span className="text-sm text-neutral-600">70-79: BUENO (Verde claro)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-warning-500 rounded"></div>
                <span className="text-sm text-neutral-600">60-69: NEUTRAL (Naranja)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-warning-400 rounded"></div>
                <span className="text-sm text-neutral-600">50-59: PRECAUCIÓN (Naranja claro)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-danger-500 rounded"></div>
                <span className="text-sm text-neutral-600">&lt;50: EVITAR (Rojo)</span>
              </div>
            </div>
          </div>

          {/* Badges de Autor */}
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Badges de Autor Dominante</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-success-500 rounded"></div>
                <span className="text-sm text-neutral-600">Lynch (Verde)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-primary-600 rounded"></div>
                <span className="text-sm text-neutral-600">O'Neil (Azul Índigo)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-info-500 rounded"></div>
                <span className="text-sm text-neutral-600">Graham (Azul Info)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Características técnicas */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <h4 className="font-semibold text-neutral-800 mb-3">Características Técnicas</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600">
            <div>
              <h5 className="font-medium text-neutral-700 mb-2">Glassmorphism</h5>
              <ul className="space-y-1">
                <li>• Backdrop blur</li>
                <li>• Transparencia 80%</li>
                <li>• Bordes sutiles</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-neutral-700 mb-2">Hover Effects</h5>
              <ul className="space-y-1">
                <li>• Scale 102%</li>
                <li>• Shadow mejorada</li>
                <li>• Gradiente sutil</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-neutral-700 mb-2">Radar Chart</h5>
              <ul className="space-y-1">
                <li>• Colores oficiales</li>
                <li>• Tooltips mejorados</li>
                <li>• Grid personalizado</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrinityScoreCardShowcase;
