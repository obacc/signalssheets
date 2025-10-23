import React from 'react';

interface TrinityScoreBarProps {
  score: number;
  showLabel?: boolean;
}

export const TrinityScoreBar: React.FC<TrinityScoreBarProps> = ({
  score,
  showLabel = true
}) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-lynch transition-all duration-500"
          style={{ width: score + '%' }}
        />
      </div>
      {showLabel && (
        <span className="font-bold text-lg text-slate-900 min-w-[3rem] text-right">
          {score}
        </span>
      )}
    </div>
  );
};

export default TrinityScoreBar;
