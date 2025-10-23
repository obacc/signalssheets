import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Activity, ShieldCheck, CheckCircle, ArrowRight, LineChart, Bell, Download } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Logo from '../components/brand/Logo';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-lynch/10 text-lynch rounded-full text-sm font-semibold mb-6">
              <span className="w-2 h-2 bg-lynch rounded-full animate-pulse"></span>
              Trinity Method Trading Signals
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
              Trading Signals with the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-oneil to-lynch">
                Trinity Method
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto">
              Combining the best of Peter Lynch, William O'Neil, and Benjamin Graham 
              into a single, powerful scoring system
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button variant="primary" as="link" to="/dashboard" size="lg">
                View Signals Now
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="secondary" size="lg">
                Documentation
              </Button>
            </div>

            {/* Stats Badges */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200">
                <CheckCircle className="w-5 h-5 text-lynch" />
                <span className="font-semibold text-slate-700">500+ Tickers Analyzed Daily</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200">
                <CheckCircle className="w-5 h-5 text-oneil" />
                <span className="font-semibold text-slate-700">180+ Active Signals</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200">
                <CheckCircle className="w-5 h-5 text-graham" />
                <span className="font-semibold text-slate-700">3 Proven Strategies</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CRITICAL: Trinity Method Section - THE MISSING PIECE */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Trinity Method: The Best of 3 Worlds
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                We combine the proven strategies of the three greatest investors in history 
                into a single, powerful scoring system
              </p>
            </div>

            {/* Three Author Cards */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Peter Lynch Card */}
              <Card hover className="bg-gradient-to-br from-emerald-50 to-white border-lynch/20">
                <div className="w-16 h-16 rounded-full bg-lynch flex items-center justify-center mb-6">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Peter Lynch</h3>
                <p className="text-slate-600 mb-6">
                  Identifies companies with solid growth and exceptional fundamentals
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-lynch mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Favorable PEG Ratio</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-lynch mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Consistent Growth</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-lynch mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Solid Balance Sheet</span>
                  </li>
                </ul>
              </Card>

              {/* William O'Neil Card */}
              <Card hover className="bg-gradient-to-br from-sky-50 to-white border-oneil/20">
                <div className="w-16 h-16 rounded-full bg-oneil flex items-center justify-center mb-6">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">William O'Neil</h3>
                <p className="text-slate-600 mb-6">
                  Detects stocks with exceptional momentum and relative strength
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-oneil mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Breakout Patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-oneil mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Sector Leadership</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-oneil mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Institutional Support</span>
                  </li>
                </ul>
              </Card>

              {/* Benjamin Graham Card */}
              <Card hover className="bg-gradient-to-br from-purple-50 to-white border-graham/20">
                <div className="w-16 h-16 rounded-full bg-graham flex items-center justify-center mb-6">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Benjamin Graham</h3>
                <p className="text-slate-600 mb-6">
                  Values companies with margin of safety and solid fundamentals
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-graham mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Margin of Safety</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-graham mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Conservative Valuation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-graham mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Stable Dividends</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Powerful Features
              </h2>
              <p className="text-xl text-slate-600">
                Everything you need to make informed trading decisions
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <LineChart className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Real-time Trinity Score</h3>
                <p className="text-slate-600">
                  Get instant Trinity Method scores combining all three strategies
                </p>
              </Card>

              <Card>
                <Bell className="w-12 h-12 text-oneil mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Email Alerts</h3>
                <p className="text-slate-600">
                  Receive notifications when new high-confidence signals are detected
                </p>
              </Card>

              <Card>
                <Download className="w-12 h-12 text-lynch mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Export to Sheets</h3>
                <p className="text-slate-600">
                  Download your signals as CSV for custom analysis
                </p>
              </Card>

              <Card>
                <CheckCircle className="w-12 h-12 text-graham mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">500+ Tickers</h3>
                <p className="text-slate-600">
                  Coverage of the top 500 US stocks updated daily
                </p>
              </Card>

              <Card>
                <TrendingUp className="w-12 h-12 text-success mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Performance Tracking</h3>
                <p className="text-slate-600">
                  Monitor historical accuracy and returns of our signals
                </p>
              </Card>

              <Card>
                <Activity className="w-12 h-12 text-warning mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Market Regime Analysis</h3>
                <p className="text-slate-600">
                  Understand current market conditions and adjust strategy
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-oneil to-graham">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Start Analyzing with Trinity Method
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Join traders using the combined wisdom of Lynch, O'Neil, and Graham
            </p>
            <Button 
              variant="secondary" 
              size="lg" 
              as="link" 
              to="/dashboard"
              className="bg-white text-primary hover:bg-slate-50"
            >
              View Signals Now
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-white/80 text-sm mt-4">
              No credit card required • Free access to daily TOP 10
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
