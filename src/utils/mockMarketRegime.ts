export interface MarketRegimeData {
  current: {
    regime: 'BULL' | 'BEAR' | 'NEUTRAL';
    vix: number;
    breadth: number;
    trinityWeights: {
      lynch: number;
      oneil: number;
      graham: number;
    };
  };
  indicators: Array<{
    name: string;
    value: number;
    trend: 'up' | 'down' | 'neutral';
    description: string;
  }>;
  historical: Array<{
    month: string;
    regime: 'BULL' | 'BEAR' | 'NEUTRAL';
    vix: number;
  }>;
}

export const mockMarketRegime: MarketRegimeData = {
  current: {
    regime: 'NEUTRAL',
    vix: 18.5,
    breadth: 65,
    trinityWeights: {
      lynch: 35,
      oneil: 30,
      graham: 35
    }
  },
  indicators: [
    {
      name: 'VIX',
      value: 18.5,
      trend: 'down',
      description: 'Fear index below 20 indicates low volatility'
    },
    {
      name: 'Breadth',
      value: 65,
      trend: 'up',
      description: 'Percentage of stocks above 50-day MA'
    },
    {
      name: 'Yield Curve',
      value: -0.15,
      trend: 'neutral',
      description: '10Y-2Y spread in basis points'
    },
    {
      name: 'Dollar Strength',
      value: 102.5,
      trend: 'up',
      description: 'DXY index showing dollar strength'
    },
    {
      name: 'Commodities',
      value: 85.2,
      trend: 'down',
      description: 'CRB index performance'
    }
  ],
  historical: [
    { month: 'Jan', regime: 'BULL', vix: 15.2 },
    { month: 'Feb', regime: 'BULL', vix: 14.8 },
    { month: 'Mar', regime: 'NEUTRAL', vix: 18.1 },
    { month: 'Apr', regime: 'NEUTRAL', vix: 19.3 },
    { month: 'May', regime: 'BEAR', vix: 25.7 },
    { month: 'Jun', regime: 'BEAR', vix: 28.4 },
    { month: 'Jul', regime: 'NEUTRAL', vix: 21.2 },
    { month: 'Aug', regime: 'NEUTRAL', vix: 17.8 },
    { month: 'Sep', regime: 'BULL', vix: 16.5 },
    { month: 'Oct', regime: 'BULL', vix: 15.9 },
    { month: 'Nov', regime: 'NEUTRAL', vix: 19.1 },
    { month: 'Dec', regime: 'NEUTRAL', vix: 18.5 }
  ]
};
