import React from 'react';

interface LogoProps {
  variant?: 'full' | 'compact' | 'light';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'full', 
  size = 'md', 
  className = '' 
}) => {
  // Configuración de tamaños
  const sizeConfig = {
    sm: {
      iconSize: 32,
      textSize: {
        primary: 'text-lg',
        secondary: 'text-[8px]'
      },
      spacing: 'gap-2'
    },
    md: {
      iconSize: 48,
      textSize: {
        primary: 'text-2xl',
        secondary: 'text-[10px]'
      },
      spacing: 'gap-3'
    },
    lg: {
      iconSize: 64,
      textSize: {
        primary: 'text-3xl',
        secondary: 'text-xs'
      },
      spacing: 'gap-4'
    }
  };

  const config = sizeConfig[size];

  // Componente del isotipo (gráfico de señales)
  const SignalIcon: React.FC<{ size: number }> = ({ size }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1e3a8a' }} />
          <stop offset="50%" style={{ stopColor: '#3b82f6' }} />
          <stop offset="100%" style={{ stopColor: '#10b981' }} />
        </linearGradient>
        <linearGradient id="pointGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#10b981' }} />
          <stop offset="100%" style={{ stopColor: '#059669' }} />
        </linearGradient>
      </defs>
      
      {/* Línea ascendente principal */}
      <path 
        d="M6 36 L14 28 L22 32 L30 16 L38 20 L46 8" 
        stroke="url(#logoGradient)" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none"
        className="drop-shadow-sm"
      />
      
      {/* Puntos destacados */}
      <circle cx="30" cy="16" r="3" fill="url(#pointGradient)" className="drop-shadow-sm" />
      <circle cx="38" cy="20" r="3" fill="url(#pointGradient)" className="drop-shadow-sm" />
      
      {/* Punto inicial más pequeño */}
      <circle cx="6" cy="36" r="2" fill="#1e3a8a" opacity="0.7" />
      
      {/* Efecto de brillo en los puntos principales */}
      <circle cx="30" cy="16" r="1.5" fill="white" opacity="0.6" />
      <circle cx="38" cy="20" r="1.5" fill="white" opacity="0.6" />
    </svg>
  );

  // Componente de texto del logo
  const LogoText: React.FC<{ variant: string }> = ({ variant }) => {
    if (variant === 'compact') return null;
    
    return (
      <div className="flex flex-col">
        <div className={`${config.textSize.primary} font-bold text-neutral-900 tracking-tight leading-none`}>
          INDICIUM
        </div>
        <div className={`${config.textSize.secondary} font-semibold text-neutral-500 tracking-widest mt-0.5`}>
          SIGNALS
        </div>
      </div>
    );
  };

  // Renderizado según variante
  const renderLogo = () => {
    switch (variant) {
      case 'compact':
        return (
          <div className={`flex items-center ${className}`}>
            <SignalIcon size={config.iconSize} />
          </div>
        );
      
      case 'light':
        return (
          <div className={`flex items-center ${config.spacing} ${className}`}>
            <SignalIcon size={config.iconSize} />
            <div className="flex flex-col">
              <div className={`${config.textSize.primary} font-bold text-white tracking-tight leading-none`}>
                INDICIUM
              </div>
              <div className={`${config.textSize.secondary} font-semibold text-white/80 tracking-widest mt-0.5`}>
                SIGNALS
              </div>
            </div>
          </div>
        );
      
      case 'full':
      default:
        return (
          <div className={`flex items-center ${config.spacing} ${className}`}>
            <SignalIcon size={config.iconSize} />
            <LogoText variant={variant} />
          </div>
        );
    }
  };

  return (
    <div className="transition-transform hover:scale-105 duration-300 cursor-pointer">
      {renderLogo()}
    </div>
  );
};

export default Logo;
