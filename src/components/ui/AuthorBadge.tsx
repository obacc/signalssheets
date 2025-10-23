import React from 'react';
import { TrendingUp, Activity, ShieldCheck } from 'lucide-react';
import { Badge } from './Badge';

interface AuthorBadgeProps {
  author: 'Lynch' | "O'Neil" | 'Graham';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const authorConfig = {
  'Lynch': {
    icon: TrendingUp,
    color: 'lynch' as const,
    label: 'Lynch'
  },
  "O'Neil": {
    icon: Activity,
    color: 'oneil' as const,
    label: "O'Neil"
  },
  'Graham': {
    icon: ShieldCheck,
    color: 'graham' as const,
    label: 'Graham'
  },
};

export const AuthorBadge: React.FC<AuthorBadgeProps> = ({
  author,
  showIcon = true,
  size = 'md'
}) => {
  const config = authorConfig[author];
  const Icon = config.icon;

  return (
    <Badge variant={config.color} size={size}>
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{config.label}</span>
    </Badge>
  );
};

export default AuthorBadge;
