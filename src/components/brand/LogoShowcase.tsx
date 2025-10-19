import React from 'react';
import Logo from './Logo';

const LogoShowcase: React.FC = () => {
  return (
    <div className="p-8 bg-neutral-50 rounded-2xl">
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Logo Oficial Indicium Signals</h2>
      
      {/* Variantes del logo */}
      <div className="space-y-8">
        {/* Full Logo - Diferentes tamaños */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-4">Logo Completo</h3>
          <div className="flex items-end gap-8">
            <div className="text-center">
              <Logo variant="full" size="sm" />
              <p className="text-xs text-neutral-500 mt-2">Small (32px)</p>
            </div>
            <div className="text-center">
              <Logo variant="full" size="md" />
              <p className="text-xs text-neutral-500 mt-2">Medium (48px)</p>
            </div>
            <div className="text-center">
              <Logo variant="full" size="lg" />
              <p className="text-xs text-neutral-500 mt-2">Large (64px)</p>
            </div>
          </div>
        </div>

        {/* Compact Logo */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-4">Logo Compacto (Mobile)</h3>
          <div className="flex items-end gap-8">
            <div className="text-center">
              <Logo variant="compact" size="sm" />
              <p className="text-xs text-neutral-500 mt-2">Small (32px)</p>
            </div>
            <div className="text-center">
              <Logo variant="compact" size="md" />
              <p className="text-xs text-neutral-500 mt-2">Medium (48px)</p>
            </div>
            <div className="text-center">
              <Logo variant="compact" size="lg" />
              <p className="text-xs text-neutral-500 mt-2">Large (64px)</p>
            </div>
          </div>
        </div>

        {/* Light Logo */}
        <div className="bg-neutral-900 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Logo Light (Fondos Oscuros)</h3>
          <div className="flex items-end gap-8">
            <div className="text-center">
              <Logo variant="light" size="sm" />
              <p className="text-xs text-neutral-400 mt-2">Small (32px)</p>
            </div>
            <div className="text-center">
              <Logo variant="light" size="md" />
              <p className="text-xs text-neutral-400 mt-2">Medium (48px)</p>
            </div>
            <div className="text-center">
              <Logo variant="light" size="lg" />
              <p className="text-xs text-neutral-400 mt-2">Large (64px)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Especificaciones técnicas */}
      <div className="mt-8 p-6 bg-white rounded-xl border border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-700 mb-4">Especificaciones Técnicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-600">
          <div>
            <h4 className="font-semibold text-neutral-800 mb-2">Colores</h4>
            <ul className="space-y-1">
              <li>• Primary: #1e3a8a (Azul Índigo)</li>
              <li>• Success: #10b981 (Verde)</li>
              <li>• Neutral: #64748b (Gris)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-neutral-800 mb-2">Tipografía</h4>
            <ul className="space-y-1">
              <li>• Font: Inter</li>
              <li>• Weight: Bold/Semibold</li>
              <li>• Tracking: Tight/Wide</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoShowcase;
