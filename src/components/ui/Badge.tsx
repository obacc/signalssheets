import React from 'react';

interface BadgeProps {
  variant?: 'buy' | 'sell' | 'hold' | 'lynch' | 'oneil' | 'graham' | 'primary' | 'secondary';
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantClasses = {
  buy: 'bg-buy/10 text-buy border-buy/20',
  sell: 'bg-sell/10 text-sell border-sell/20',
  hold: 'bg-hold/10 text-hold border-hold/20',
  lynch: 'bg-lynch/10 text-lynch border-lynch/20',
  oneil: 'bg-oneil/10 text-oneil border-oneil/20',
  graham: 'bg-graham/10 text-graham border-graham/20',
  primary: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'secondary',
  children,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center gap-1.5 rounded-full border font-semibold
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
