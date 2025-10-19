import React, { useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { BookOpen, TrendingUp, Shield } from 'lucide-react';
import type { Signal } from '../../types/index';

interface StatsOverviewProps {
  signals: Signal[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ signals }) => {
  
  // Memos para datos - Performance optimizada
  const signalTypeData = useMemo(() => {
    const counts = signals.reduce((acc, signal) => {
      acc[signal.signal] = (acc[signal.signal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'BUY', value: counts.BUY || 0, color: '#10b981' },
      { name: 'HOLD', value: counts.HOLD || 0, color: '#f59e0b' },
      { name: 'SELL', value: counts.SELL || 0, color: '#ef4444' },
    ].filter(item => item.value > 0);
  }, [signals]);

  const authorData = useMemo(() => {
    const counts = signals.reduce((acc, signal) => {
      acc[signal.author] = (acc[signal.author] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Lynch', value: counts.Lynch || 0, color: '#10b981' },
      { name: "O'Neil", value: counts["O'Neil"] || 0, color: '#1e3a8a' },
      { name: 'Graham', value: counts.Graham || 0, color: '#3b82f6' },
    ].filter(item => item.value > 0);
  }, [signals]);

  const top5Signals = useMemo(() => {
    return [...signals]
      .sort((a, b) => b.trinityScore - a.trinityScore)
      .slice(0, 5);
  }, [signals]);

  const sectorData = useMemo(() => {
    const counts = signals.reduce((acc, signal) => {
      acc[signal.sector] = (acc[signal.sector] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count);
  }, [signals]);

  // Helper function para color de score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-600 bg-success-50 border-success-200';
    if (score >= 70) return 'text-success-500 bg-success-50 border-success-200';
    if (score >= 60) return 'text-warning-600 bg-warning-50 border-warning-200';
    return 'text-neutral-600 bg-neutral-50 border-neutral-200';
  };

  // Si no hay señales
  if (signals.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl p-12 mb-8 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-neutral-700 mb-2">
          No hay datos para analizar
        </h3>
        <p className="text-neutral-500">
          Ajusta los filtros para ver estadísticas
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">
          📊 Análisis de Señales
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Métricas agregadas de las señales activas
        </p>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        
        {/* Promedio Trinity Score */}
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-600 mb-1">
            Trinity Score Promedio
          </div>
          <div className="text-2xl font-bold text-primary-600">
            {(signals.reduce((sum, s) => sum + s.trinityScore, 0) / signals.length).toFixed(1)}
          </div>
        </div>

        {/* Expected Return Promedio */}
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-600 mb-1">
            Retorno Esperado Promedio
          </div>
          <div className="text-2xl font-bold text-success-600">
            {(signals.reduce((sum, s) => sum + (s.expectedReturn || 0), 0) / signals.length).toFixed(1)}%
          </div>
        </div>

        {/* Confidence Level Promedio */}
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-600 mb-1">
            Confianza Promedio
          </div>
          <div className="text-2xl font-bold text-info-600">
            {(signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length).toFixed(0)}%
          </div>
        </div>

        {/* Total Señales */}
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-600 mb-1">
            Total Señales
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            {signals.length}
          </div>
        </div>

      </div>

      {/* Grid de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Distribución por Signal Type */}
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Distribución por Tipo de Señal
          </h3>
          
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={signalTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {signalTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          {/* Resumen numérico debajo */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center p-2 bg-success-50 rounded-lg border border-success-200">
              <div className="text-xs text-success-700 font-medium">BUY</div>
              <div className="text-lg font-bold text-success-600">
                {signalTypeData.find(d => d.name === 'BUY')?.value || 0}
              </div>
            </div>
            <div className="text-center p-2 bg-warning-50 rounded-lg border border-warning-200">
              <div className="text-xs text-warning-700 font-medium">HOLD</div>
              <div className="text-lg font-bold text-warning-600">
                {signalTypeData.find(d => d.name === 'HOLD')?.value || 0}
              </div>
            </div>
            <div className="text-center p-2 bg-danger-50 rounded-lg border border-danger-200">
              <div className="text-xs text-danger-700 font-medium">SELL</div>
              <div className="text-lg font-bold text-danger-600">
                {signalTypeData.find(d => d.name === 'SELL')?.value || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Distribución por Autor */}
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Distribución por Autor Dominante
          </h3>
          
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={authorData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {authorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          {/* Resumen numérico */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center p-2 bg-success-50 rounded-lg border border-success-200">
              <div className="text-xs text-success-700 font-medium flex items-center justify-center gap-1">
                <BookOpen className="w-3 h-3" />
                Lynch
              </div>
              <div className="text-lg font-bold text-success-600">
                {authorData.find(d => d.name === 'Lynch')?.value || 0}
              </div>
            </div>
            <div className="text-center p-2 bg-primary-50 rounded-lg border border-primary-200">
              <div className="text-xs text-primary-700 font-medium flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" />
                O'Neil
              </div>
              <div className="text-lg font-bold text-primary-600">
                {authorData.find(d => d.name === "O'Neil")?.value || 0}
              </div>
            </div>
            <div className="text-center p-2 bg-info-50 rounded-lg border border-info-200">
              <div className="text-xs text-info-700 font-medium flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Graham
              </div>
              <div className="text-lg font-bold text-info-600">
                {authorData.find(d => d.name === 'Graham')?.value || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Top 5 por Trinity Score */}
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            🏆 Top 5 Trinity Scores
          </h3>
          
          <div className="space-y-3">
            {top5Signals.map((signal, index) => (
              <div 
                key={signal.id}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-primary-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full text-primary-700 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900">{signal.ticker}</div>
                    <div className="text-xs text-neutral-600">{signal.companyName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    signal.signal === 'BUY' ? 'bg-success-500 text-white' :
                    signal.signal === 'HOLD' ? 'bg-warning-500 text-white' :
                    'bg-danger-500 text-white'
                  }`}>
                    {signal.signal}
                  </span>
                  <div className={`px-3 py-1 rounded-lg border font-bold ${getScoreColor(signal.trinityScore)}`}>
                    {signal.trinityScore.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Estado vacío */}
          {top5Signals.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm">No hay señales para mostrar</p>
            </div>
          )}
        </div>

        {/* Card 4: Distribución por Sector */}
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Distribución por Sector
          </h3>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sectorData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="sector" 
                tick={{ fill: '#64748b', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#1e3a8a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Resumen de sectores */}
          <div className="mt-4 space-y-2">
            {sectorData.slice(0, 5).map((item) => (
              <div key={item.sector} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">{item.sector}</span>
                <span className="font-semibold text-primary-600">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatsOverview;
