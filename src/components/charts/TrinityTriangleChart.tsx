import React from 'react';

interface TrinityTriangleChartProps {
  lynch: number;    // 0-100
  oneil: number;    // 0-100
  graham: number;   // 0-100
  size?: 'sm' | 'md' | 'lg';
}

export const TrinityTriangleChart: React.FC<TrinityTriangleChartProps> = ({
  lynch,
  oneil,
  graham,
  size = 'md'
}) => {
  const dimensions = {
    sm: { width: 120, height: 120, fontSize: 10 },
    md: { width: 200, height: 200, fontSize: 12 },
    lg: { width: 280, height: 280, fontSize: 14 },
  };

  const { width, height, fontSize } = dimensions[size];
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width * 0.35;

  // Calculate triangle vertices (equilateral triangle)
  const topPoint = {
    x: centerX,
    y: centerY - radius,
    label: 'Lynch',
    value: lynch,
    color: '#10b981' // green
  };

  const bottomLeft = {
    x: centerX - radius * Math.cos(Math.PI / 6),
    y: centerY + radius * Math.sin(Math.PI / 6),
    label: 'Graham',
    value: graham,
    color: '#8b5cf6' // purple
  };

  const bottomRight = {
    x: centerX + radius * Math.cos(Math.PI / 6),
    y: centerY + radius * Math.sin(Math.PI / 6),
    label: "O'Neil",
    value: oneil,
    color: '#0ea5e9' // blue
  };

  // Calculate data points based on values (0-100 scale)
  const dataTopPoint = {
    x: centerX + (topPoint.x - centerX) * (lynch / 100),
    y: centerY + (topPoint.y - centerY) * (lynch / 100)
  };

  const dataBottomLeft = {
    x: centerX + (bottomLeft.x - centerX) * (graham / 100),
    y: centerY + (bottomLeft.y - centerY) * (graham / 100)
  };

  const dataBottomRight = {
    x: centerX + (bottomRight.x - centerX) * (oneil / 100),
    y: centerY + (bottomRight.y - centerY) * (oneil / 100)
  };

  // Create path for the triangle outline
  const outlinePath = `M ${topPoint.x} ${topPoint.y} L ${bottomLeft.x} ${bottomLeft.y} L ${bottomRight.x} ${bottomRight.y} Z`;

  // Create path for the data triangle (filled)
  const dataPath = `M ${dataTopPoint.x} ${dataTopPoint.y} L ${dataBottomLeft.x} ${dataBottomLeft.y} L ${dataBottomRight.x} ${dataBottomRight.y} Z`;

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="#f1f5f9"
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        {/* Grid lines (concentric triangles at 25%, 50%, 75%) */}
        {[0.25, 0.5, 0.75].map((scale) => {
          const gridTop = {
            x: centerX + (topPoint.x - centerX) * scale,
            y: centerY + (topPoint.y - centerY) * scale
          };
          const gridLeft = {
            x: centerX + (bottomLeft.x - centerX) * scale,
            y: centerY + (bottomLeft.y - centerY) * scale
          };
          const gridRight = {
            x: centerX + (bottomRight.x - centerX) * scale,
            y: centerY + (bottomRight.y - centerY) * scale
          };

          return (
            <path
              key={scale}
              d={`M ${gridTop.x} ${gridTop.y} L ${gridLeft.x} ${gridLeft.y} L ${gridRight.x} ${gridRight.y} Z`}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          );
        })}

        {/* Triangle outline */}
        <path
          d={outlinePath}
          fill="none"
          stroke="#64748b"
          strokeWidth="2"
        />

        {/* Lines from center to vertices */}
        <line x1={centerX} y1={centerY} x2={topPoint.x} y2={topPoint.y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
        <line x1={centerX} y1={centerY} x2={bottomLeft.x} y2={bottomLeft.y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
        <line x1={centerX} y1={centerY} x2={bottomRight.x} y2={bottomRight.y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />

        {/* Data triangle (filled with gradient) */}
        <defs>
          <linearGradient id="trinityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        <path
          d={dataPath}
          fill="url(#trinityGradient)"
          stroke="#1e293b"
          strokeWidth="2"
        />

        {/* Data points (circles) */}
        <circle cx={dataTopPoint.x} cy={dataTopPoint.y} r="4" fill={topPoint.color} stroke="white" strokeWidth="2" />
        <circle cx={dataBottomLeft.x} cy={dataBottomLeft.y} r="4" fill={bottomLeft.color} stroke="white" strokeWidth="2" />
        <circle cx={dataBottomRight.x} cy={dataBottomRight.y} r="4" fill={bottomRight.color} stroke="white" strokeWidth="2" />

        {/* Labels and values */}
        <text
          x={topPoint.x}
          y={topPoint.y - 15}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="600"
          fill="#475569"
        >
          {topPoint.label}
        </text>
        <text
          x={topPoint.x}
          y={topPoint.y - 2}
          textAnchor="middle"
          fontSize={fontSize + 2}
          fontWeight="700"
          fill={topPoint.color}
        >
          {topPoint.value}
        </text>

        <text
          x={bottomLeft.x}
          y={bottomLeft.y + 20}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="600"
          fill="#475569"
        >
          {bottomLeft.label}
        </text>
        <text
          x={bottomLeft.x}
          y={bottomLeft.y + 33}
          textAnchor="middle"
          fontSize={fontSize + 2}
          fontWeight="700"
          fill={bottomLeft.color}
        >
          {bottomLeft.value}
        </text>

        <text
          x={bottomRight.x}
          y={bottomRight.y + 20}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="600"
          fill="#475569"
        >
          {bottomRight.label}
        </text>
        <text
          x={bottomRight.x}
          y={bottomRight.y + 33}
          textAnchor="middle"
          fontSize={fontSize + 2}
          fontWeight="700"
          fill={bottomRight.color}
        >
          {bottomRight.value}
        </text>
      </svg>
    </div>
  );
};

export default TrinityTriangleChart;
