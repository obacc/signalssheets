import React from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { BookOpen, TrendingUp, Shield } from 'lucide-react'

interface TrinityScoreCardProps {
  lynchScore: number;
  oneilScore: number;
  grahamScore: number;
  trinityScore: number;
  dominantAuthor: 'Lynch' | 'O\'Neil' | 'Graham';
  ticker: string;
  companyName: string;
}

const TrinityScoreCard: React.FC<TrinityScoreCardProps> = ({
  lynchScore,
  oneilScore,
  grahamScore,
  trinityScore,
  dominantAuthor,
  ticker,
  companyName
}) => {
  // Datos para el gráfico radar
  const radarData = [
    { method: 'Lynch', score: lynchScore, fullMark: 100 },
    { method: 'O\'Neil', score: oneilScore, fullMark: 100 },
    { method: 'Graham', score: grahamScore, fullMark: 100 },
  ]

  // Función para determinar el color basado en el Trinity Score - PALETA OFICIAL
  const getScoreColor = (score: number) => {
    if (score >= 80) return {
      bg: 'bg-success-50',
      text: 'text-success-700',
      border: 'border-success-200',
      badge: 'bg-success-500',
      label: 'EXCELENTE'
    };
    if (score >= 70) return {
      bg: 'bg-success-100',
      text: 'text-success-600',
      border: 'border-success-300',
      badge: 'bg-success-400',
      label: 'BUENO'
    };
    if (score >= 60) return {
      bg: 'bg-warning-50',
      text: 'text-warning-700',
      border: 'border-warning-200',
      badge: 'bg-warning-500',
      label: 'NEUTRAL'
    };
    if (score >= 50) return {
      bg: 'bg-warning-100',
      text: 'text-warning-600',
      border: 'border-warning-300',
      badge: 'bg-warning-400',
      label: 'PRECAUCIÓN'
    };
    return {
      bg: 'bg-danger-50',
      text: 'text-danger-700',
      border: 'border-danger-200',
      badge: 'bg-danger-500',
      label: 'EVITAR'
    };
  };

  // Función para obtener el badge del autor - COLORES OFICIALES
  const getAuthorBadge = (author: string) => {
    switch(author) {
      case 'Lynch':
        return {
          icon: BookOpen,
          color: 'bg-success-500',
          textColor: 'text-white',
          label: 'Lynch'
        };
      case "O'Neil":
        return {
          icon: TrendingUp,
          color: 'bg-primary-600',
          textColor: 'text-white',
          label: "O'Neil"
        };
      case 'Graham':
        return {
          icon: Shield,
          color: 'bg-info-500',
          textColor: 'text-white',
          label: 'Graham'
        };
      default:
        return {
          icon: BookOpen,
          color: 'bg-neutral-500',
          textColor: 'text-white',
          label: author
        };
    }
  };

  const scoreColors = getScoreColor(trinityScore)
  const authorBadge = getAuthorBadge(dominantAuthor)
  const AuthorIcon = authorBadge.icon

  return (
    <div className="group relative bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl p-6 
                    hover:shadow-xl hover:shadow-primary-100/50 hover:scale-[1.02] 
                    hover:border-primary-400 transition-all duration-300 cursor-pointer">
      
      {/* Gradiente sutil en hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 to-success-50/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      
      {/* Header mejorado */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-neutral-900">{ticker}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${authorBadge.color} ${authorBadge.textColor} flex items-center gap-1`}>
              <AuthorIcon className="w-3 h-3" />
              {authorBadge.label}
            </span>
          </div>
          <p className="text-sm text-neutral-600 truncate">{companyName}</p>
        </div>
      </div>

      {/* Trinity Score Central - Diseño mejorado */}
      <div className={`text-center p-4 rounded-lg mb-4 ${scoreColors.bg} border ${scoreColors.border}`}>
        <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1">
          Trinity Score
        </div>
        <div className={`text-4xl font-bold ${scoreColors.text}`}>
          {trinityScore.toFixed(1)}
        </div>
        <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold text-white ${scoreColors.badge}`}>
          {scoreColors.label}
        </div>
      </div>

      {/* Radar Chart - Colores oficiales */}
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis 
              dataKey="method" 
              tick={{ fill: '#64748b', fontSize: 12 }} 
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fill: '#94a3b8', fontSize: 10 }} 
            />
            <Radar
              name="Scores"
              dataKey="score"
              stroke="#1e3a8a"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
              itemStyle={{ color: '#475569' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Scores Individuales - Diseño mejorado */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center p-2 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="text-xs text-neutral-600 mb-1">Lynch</div>
          <div className="text-lg font-bold text-success-600">{lynchScore}</div>
        </div>
        <div className="text-center p-2 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="text-xs text-neutral-600 mb-1">O'Neil</div>
          <div className="text-lg font-bold text-primary-600">{oneilScore}</div>
        </div>
        <div className="text-center p-2 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="text-xs text-neutral-600 mb-1">Graham</div>
          <div className="text-lg font-bold text-info-600">{grahamScore}</div>
        </div>
      </div>
    </div>
  )
}

export default TrinityScoreCard
