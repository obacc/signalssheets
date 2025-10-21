import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Star } from 'lucide-react';

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Free',
      price: 0,
      priceYearly: 0,
      features: [
        '10 signals per day',
        'Basic filters',
        'CSV export',
        'Email support',
        'Mobile app access'
      ],
      limitations: [
        'Limited historical data',
        'No advanced analytics',
        'Basic charting tools'
      ],
      popular: false
    },
    {
      name: 'Pro',
      priceMonthly: 29,
      priceYearly: 290,
      features: [
        'Unlimited signals',
        'All advanced filters',
        'Google Sheets integration',
        'Market Regime analysis',
        'Custom alerts',
        'Priority email support',
        'Advanced charting',
        'Portfolio tracking'
      ],
      limitations: [],
      popular: true
    },
    {
      name: 'Premium',
      priceMonthly: 79,
      priceYearly: 790,
      features: [
        'Everything in Pro',
        'API access',
        'Real-time alerts',
        'Custom indicators',
        'White-label options',
        'Priority phone support',
        'Advanced backtesting',
        'Risk management tools',
        'Custom reports'
      ],
      limitations: [],
      popular: false
    }
  ];

  const getCurrentPrice = (plan: typeof plans[0]) => {
    if (plan.name === 'Free') return 0;
    return billingPeriod === 'monthly' ? (plan.priceMonthly || 0) : (plan.priceYearly || 0) / 12;
  };

  const getYearlySavings = (plan: typeof plans[0]) => {
    if (plan.name === 'Free' || !plan.priceMonthly) return 0;
    const monthlyTotal = plan.priceMonthly * 12;
    const yearlyPrice = plan.priceYearly;
    return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 mb-8">
            Start free, upgrade as you grow. All plans include our core signals platform.
          </p>
          
          {/* Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button 
                onClick={() => setBillingPeriod('monthly')} 
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'monthly' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  billingPeriod === 'yearly' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`bg-white rounded-2xl p-8 shadow-lg border-2 relative ${
                plan.popular 
                  ? 'border-blue-500 transform scale-105' 
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">
                    ${getCurrentPrice(plan).toFixed(0)}
                  </span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                {billingPeriod === 'yearly' && plan.name !== 'Free' && (
                  <div className="text-sm text-green-600 font-semibold">
                    Save {getYearlySavings(plan)}% with yearly billing
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-8">
                <h4 className="font-semibold text-gray-900">What's included:</h4>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-center">
                <Link 
                  to="/register" 
                  className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : plan.name === 'Free'
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.name === 'Free' ? 'Get Started Free' : `Start ${plan.name} Plan`}
                </Link>
                {plan.name !== 'Free' && (
                  <p className="text-xs text-gray-500 mt-2">
                    {billingPeriod === 'monthly' ? 'Billed monthly' : 'Billed yearly'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h3>
              <p className="text-gray-600 text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600 text-sm">Yes, start with our Free plan to explore the platform. No credit card required.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 text-sm">We accept all major credit cards, PayPal, and bank transfers for yearly plans.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600 text-sm">Yes, you can cancel your subscription at any time. No cancellation fees.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-gray-600 mb-6">Join thousands of investors making smarter decisions with SignalsSheets.</p>
          <Link 
            to="/register"
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Free Today
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
