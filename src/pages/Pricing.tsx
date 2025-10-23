import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check, Star } from 'lucide-react';

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for exploring the Trinity Method',
      priceMonthly: 0,
      priceYearly: 0,
      popular: false,
      features: [
        'Daily Top 10 Signals',
        'Basic Trinity Method scoring',
        'Market regime indicator',
        'CSV export',
        'Email support',
        'Mobile responsive design'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For serious investors',
      priceMonthly: 39,
      priceYearly: 390,
      popular: true,
      features: [
        'Everything in Free',
        'Full Top 500 Signals access',
        'Advanced filtering & search',
        'Watchlist with unlimited signals',
        'Price alerts & notifications',
        'Historical data (6 months)',
        'Priority email support',
        'Trinity Triangle charts',
        'Custom author weights'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'For professional traders',
      priceMonthly: 79,
      priceYearly: 790,
      popular: false,
      features: [
        'Everything in Pro',
        'Full historical data (3+ years)',
        'API access for automation',
        'Real-time signal updates',
        'Custom indicators & backtesting',
        'Portfolio tracking & analytics',
        'White-label options',
        'Priority phone & chat support',
        'Dedicated account manager',
        'Custom reports & exports'
      ]
    }
  ];

  const getCurrentPrice = (plan: typeof plans[0]) => {
    if (billingPeriod === 'monthly') {
      return plan.priceMonthly;
    }
    return Math.floor(plan.priceYearly / 12);
  };

  const getTotalPrice = (plan: typeof plans[0]) => {
    if (billingPeriod === 'monthly') {
      return plan.priceMonthly;
    }
    return plan.priceYearly;
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.priceMonthly === 0) return 0;
    const monthlyTotal = plan.priceMonthly * 12;
    return Math.round(((monthlyTotal - plan.priceYearly) / monthlyTotal) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Start with our free plan and upgrade as you grow. All plans include access to the Trinity Method signals.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-200 rounded-lg p-1 flex items-center">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors relative ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-buy text-white text-xs px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular
                  ? 'border-2 border-primary shadow-xl ring-4 ring-primary/10'
                  : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-primary text-white px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 shadow-lg">
                    <Star className="w-4 h-4 fill-white" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Card Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-slate-900">
                      ${getCurrentPrice(plan)}
                    </span>
                    <span className="text-slate-600">/month</span>
                  </div>
                  {billingPeriod === 'yearly' && plan.priceMonthly > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-slate-600">
                        ${getTotalPrice(plan)}/year
                      </p>
                      <p className="text-sm text-buy font-semibold">
                        Save {getSavings(plan)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-buy flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="mt-auto">
                <Link to="/register">
                  <Button
                    variant={plan.popular ? 'primary' : 'secondary'}
                    className="w-full"
                  >
                    {plan.priceMonthly === 0 ? 'Get Started Free' : `Start ${plan.name} Plan`}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-slate-600 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any differences.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-slate-600 text-sm">
                Our Free plan gives you full access to Daily Top 10 signals with no credit card required. Upgrade anytime to unlock more features.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-600 text-sm">
                We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers for yearly subscriptions.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-slate-600 text-sm">
                Yes, you can cancel your subscription at any time with no penalties. Your access continues until the end of your billing period.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                What is the Trinity Method?
              </h3>
              <p className="text-slate-600 text-sm">
                The Trinity Method combines Peter Lynch's growth investing, William O'Neil's momentum trading, and Benjamin Graham's value investing into one powerful scoring system.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-slate-600 text-sm">
                Yes, we offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, contact support for a full refund.
              </p>
            </div>
          </div>
        </Card>

        {/* Final CTA */}
        <div className="text-center py-12 px-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to start trading smarter?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Join thousands of investors using the Trinity Method to make better investment decisions.
          </p>
          <Link to="/register">
            <Button variant="primary" className="px-8 py-3 text-lg">
              Start Free Today
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
