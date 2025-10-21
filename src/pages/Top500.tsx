import { useState } from 'react';
import { mockSignals } from '../utils/mockData';
import SignalsTable from '../components/dashboard/SignalsTable';
import TrinityScoreCard from '../components/TrinityScoreCard';

const Top500 = () => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Calculate stats
  const totalSignals = mockSignals.length;
  const buySignals = mockSignals.filter(s => s.signal === 'BUY').length;
  const holdSignals = mockSignals.filter(s => s.signal === 'HOLD').length;
  const sellSignals = mockSignals.filter(s => s.signal === 'SELL').length;
  const avgTrinityScore = mockSignals.reduce((sum, s) => sum + s.trinityScore, 0) / totalSignals;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header con Stats */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TOP 500 Signals</h1>
          <p className="text-gray-600 mb-6">Comprehensive analysis of the top 500 investment opportunities</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Signals</div>
              <div className="text-3xl font-bold text-gray-900">{totalSignals}</div>
              <div className="text-xs text-gray-500 mt-1">Active opportunities</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Buy Signals</div>
              <div className="text-3xl font-bold text-green-600">{buySignals}</div>
              <div className="text-xs text-gray-500 mt-1">{((buySignals/totalSignals)*100).toFixed(1)}% of total</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Hold Signals</div>
              <div className="text-3xl font-bold text-yellow-600">{holdSignals}</div>
              <div className="text-xs text-gray-500 mt-1">{((holdSignals/totalSignals)*100).toFixed(1)}% of total</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Sell Signals</div>
              <div className="text-3xl font-bold text-red-600">{sellSignals}</div>
              <div className="text-xs text-gray-500 mt-1">{((sellSignals/totalSignals)*100).toFixed(1)}% of total</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Avg Trinity Score</div>
              <div className="text-3xl font-bold text-blue-600">{avgTrinityScore.toFixed(1)}</div>
              <div className="text-xs text-gray-500 mt-1">Weighted average</div>
            </div>
          </div>
        </div>

        {/* Toggle View */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            Showing {totalSignals} signals • Last updated: {new Date().toLocaleDateString()}
          </div>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('table')} 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Table View
            </button>
            <button 
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Card View
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'table' ? (
          <SignalsTable signals={mockSignals} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockSignals.map(signal => (
              <TrinityScoreCard 
                key={signal.id} 
                lynchScore={signal.lynchScore}
                oneilScore={signal.oneilScore}
                grahamScore={signal.grahamScore}
                trinityScore={signal.trinityScore}
                dominantAuthor={signal.author as 'Lynch' | 'O\'Neil' | 'Graham'}
                ticker={signal.ticker}
                companyName={signal.companyName}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Top500;
