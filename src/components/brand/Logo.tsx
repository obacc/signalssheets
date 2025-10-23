import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'light';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = ''
}) => {
  const dimensions = {
    sm: { icon: 32, text: 'text-lg' },
    md: { icon: 48, text: 'text-2xl' },
    lg: { icon: 64, text: 'text-3xl' },
  };

  const { icon: iconSize, text: textSize } = dimensions[size];
  const isLight = variant === 'light';
  const textColor = isLight ? 'text-white' : 'text-slate-900';
  const subtitleColor = isLight ? 'text-slate-200' : 'text-slate-500';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Signal Wave Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="signalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Wave Line */}
        <path
          d="M6 36 L14 28 L22 32 L30 16 L38 20 L46 8"
          stroke="url(#signalGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Data Points */}
        <circle cx="14" cy="28" r="3" fill="#1e3a8a"/>
        <circle cx="22" cy="32" r="3" fill="#1e3a8a"/>
        <circle cx="30" cy="16" r="3" fill="#10b981"/>
        <circle cx="38" cy="20" r="3" fill="#10b981"/>

        {/* Arrow */}
        <path
          d="M42 12 L46 8 L46 12"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Text Logo (only in 'full' and 'light' variants) */}
      {variant !== 'icon' && (
        <div className="flex flex-col">
          <span className={`${textSize} font-extrabold ${textColor} leading-none tracking-tight`}>
            INDICIUM
          </span>
          <span className={`text-[0.4em] font-semibold ${subtitleColor} uppercase tracking-widest mt-1`}>
            SIGNALS
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
