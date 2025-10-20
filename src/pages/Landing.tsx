import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  CheckCircle,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import Logo from '../components/brand/Logo';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      
      {/* Header/Nav */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo variant="full" size="md" />
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors">
                FAQ
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg font-semibold transition-colors"
              >
                Ver Dashboard
              </Link>
              <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors">
                Ingresar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column */}
            <div>
              <div className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-6">
                ✨ Trinity Method Trading Signals
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
                Señales de Trading con el
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-success-600">
                  {' '}Trinity Method
                </span>
              </h1>
              <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                Combina las estrategias de Peter Lynch, William O'Neil y Benjamin Graham 
                en señales EOD del TOP 500 de tickers de US.
              </p>
              
              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to="/dashboard"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Ver Señales Ahora
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-neutral-300 hover:border-primary-500 text-neutral-900 rounded-xl font-bold text-lg transition-all hover:scale-105">
                  <BookOpen className="w-5 h-5" />
                  Documentación
                </button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 text-sm text-neutral-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span>500+ Señales Activas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  <span>Actualización EOD</span>
                </div>
              </div>
            </div>

            {/* Right Column - Dashboard Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-success-600 rounded-2xl blur-3xl opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-neutral-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-neutral-900">Trinity Signals Dashboard</h3>
                  <span className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-xs font-bold">
                    LIVE
                  </span>
                </div>
                
                {/* Mini Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-neutral-50 rounded-lg">
                    <div className="text-2xl font-bold text-success-600">12.5%</div>
                    <div className="text-xs text-neutral-600">% BUY</div>
                  </div>
                  <div className="text-center p-3 bg-neutral-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">1,132</div>
                    <div className="text-xs text-neutral-600">Señales</div>
                  </div>
                  <div className="text-center p-3 bg-neutral-50 rounded-lg">
                    <div className="text-2xl font-bold text-warning-600">Neutral</div>
                    <div className="text-xs text-neutral-600">Régimen</div>
                  </div>
                </div>

                {/* Mini Table */}
                <div className="space-y-2">
                  {[
                    { ticker: 'AAPL', score: 78.3, signal: 'BUY' },
                    { ticker: 'MSFT', score: 78.7, signal: 'BUY' },
                    { ticker: 'NVDA', score: 85.0, signal: 'BUY' },
                  ].map((item) => (
                    <div key={item.ticker} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <span className="font-bold text-neutral-900">{item.ticker}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-success-600">{item.score}</span>
                        <span className="px-2 py-1 bg-success-500 text-white text-xs font-bold rounded">
                          {item.signal}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Trinity Method: Lo Mejor de 3 Mundos
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Combinamos las estrategias más exitosas de la historia del trading en un único score.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Feature 1: Lynch */}
            <div className="p-8 bg-gradient-to-br from-success-50 to-white rounded-2xl border border-success-200 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-success-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Peter Lynch</h3>
              <p className="text-neutral-600 mb-4">
                Growth at Reasonable Price (GARP). Identifica empresas con crecimiento sólido a precios justos.
              </p>
              <ul className="space-y-2 text-sm text-neutral-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  PEG Ratio favorable
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  Crecimiento sostenible
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  Balance sólido
                </li>
              </ul>
            </div>

            {/* Feature 2: O'Neil */}
            <div className="p-8 bg-gradient-to-br from-primary-50 to-white rounded-2xl border border-primary-200 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">William O'Neil</h3>
              <p className="text-neutral-600 mb-4">
                CAN SLIM Method. Detecta acciones con momentum y fortaleza relativa excepcional.
              </p>
              <ul className="space-y-2 text-sm text-neutral-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary-600" />
                  High Relative Strength
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary-600" />
                  Earnings acceleration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary-600" />
                  Institutional support
                </li>
              </ul>
            </div>

            {/* Feature 3: Graham */}
            <div className="p-8 bg-gradient-to-br from-info-50 to-white rounded-2xl border border-info-200 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-info-600 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Benjamin Graham</h3>
              <p className="text-neutral-600 mb-4">
                Value Investing. Busca empresas infravaloradas con margen de seguridad.
              </p>
              <ul className="space-y-2 text-sm text-neutral-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-info-600" />
                  Valuación conservadora
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-info-600" />
                  Margen de seguridad
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-info-600" />
                  Dividendos estables
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-success-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Comienza a Operar con Señales Inteligentes
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Acceso inmediato a 500+ señales del Trinity Method. Sin tarjeta de crédito.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            Explorar Dashboard Gratis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo variant="full" size="sm" />
            </div>
            <div className="flex gap-6 text-sm text-neutral-400">
              <a href="#" className="hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Contacto</a>
            </div>
            <div className="text-sm text-neutral-500">
              © 2025 Indicium Signals. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;