import { mockMarketRegime } from '../utils/mockMarketRegime';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const MarketRegime = () => {
  const { current, indicators, historical } = mockMarketRegime;
  
  // Gauge visual simple
  const getRegimeColor = (regime: string) => {
    if (regime === 'BULL') return 'bg-green-500';
    if (regime === 'BEAR') return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getRegimeTextColor = (regime: string) => {
    if (regime === 'BULL') return 'text-green-600';
    if (regime === 'BEAR') return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Market Regime Analysis</h1>
          <p className="text-gray-600">Current market conditions and historical trends</p>
        </div>

        {/* Hero Gauge */}
        <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Current Market Regime</h2>
              <div className="flex items-center gap-4">
                <div className={`w-24 h-24 rounded-full ${getRegimeColor(current.regime)} flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">{current.regime}</span>
                </div>
                <div>
                  <div className={`text-3xl font-bold ${getRegimeTextColor(current.regime)}`}>
                    {current.regime}
                  </div>
                  <div className="text-gray-600">VIX: {current.vix}</div>
                  <div className="text-gray-600">Breadth: {current.breadth}%</div>
                </div>
              </div>
            </div>
            
            {/* Trinity Weights */}
            <div className="flex-1 max-w-md">
              <h3 className="text-lg font-semibold mb-4">Trinity Weights</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Lynch</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: `${current.trinityWeights.lynch}%`}}></div>
                  </div>
                  <span className="text-sm font-medium">{current.trinityWeights.lynch}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">O'Neil</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: `${current.trinityWeights.oneil}%`}}></div>
                  </div>
                  <span className="text-sm font-medium">{current.trinityWeights.oneil}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Graham</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: `${current.trinityWeights.graham}%`}}></div>
                  </div>
                  <span className="text-sm font-medium">{current.trinityWeights.graham}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {indicators.map((indicator, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{indicator.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  indicator.trend === 'up' ? 'bg-green-100 text-green-800' :
                  indicator.trend === 'down' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {indicator.trend}
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{indicator.value}</div>
              <p className="text-sm text-gray-600">{indicator.description}</p>
            </div>
          ))}
        </div>

        {/* Historical Chart */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h3 className="text-2xl font-semibold mb-6">Historical VIX & Regime</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historical}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'vix' ? 'VIX' : 'Regime']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="vix" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketRegime;
