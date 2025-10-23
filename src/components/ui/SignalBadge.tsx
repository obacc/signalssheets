import React from 'react';
import { Badge } from './Badge';

interface SignalBadgeProps {
  signal: 'BUY' | 'SELL' | 'HOLD';
  large?: boolean;
}

const signalConfig = {
  BUY: { icon: '🎯', color: 'buy' as const },
  SELL: { icon: '⚠️', color: 'sell' as const },
  HOLD: { icon: '⏸️', color: 'hold' as const },
};

export const SignalBadge: React.FC<SignalBadgeProps> = ({ signal, large = false }) => {
  const config = signalConfig[signal];

  return (
    <Badge variant={config.color} size={large ? 'lg' : 'md'}>
      <span>{config.icon}</span>
      <span className={large ? 'font-bold' : ''}>{signal}</span>
    </Badge>
  );
};

export default SignalBadge;
