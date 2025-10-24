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
              Señales de Trading con el{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-oneil to-lynch">
                Trinity Method
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto">
              Combinando lo mejor de Peter Lynch, William O'Neil y Benjamin Graham
              en un único y poderoso sistema de scoring
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button variant="primary" as="link" to="/dashboard" size="lg">
                Ver Señales Ahora
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="secondary" size="lg">
                Documentación
              </Button>
            </div>

            {/* Stats Badges */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200">
                <CheckCircle className="w-5 h-5 text-lynch" />
                <span className="font-semibold text-slate-700">500+ Tickers Analizados Diariamente</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200">
                <CheckCircle className="w-5 h-5 text-oneil" />
                <span className="font-semibold text-slate-700">180+ Señales Activas</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200">
                <CheckCircle className="w-5 h-5 text-graham" />
                <span className="font-semibold text-slate-700">3 Estrategias Probadas</span>
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
                Trinity Method: Lo Mejor de 3 Mundos
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Combinamos las estrategias probadas de los tres mejores inversores de todos los tiempos
                en un único y poderoso sistema de scoring
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
                  Identifica empresas con crecimiento sólido y fundamentos excepcionales
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-lynch mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Ratio PEG Favorable</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-lynch mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Crecimiento Consistente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-lynch mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Balance Sólido</span>
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
                  Detecta acciones con momentum excepcional y fuerza relativa
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-oneil mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Patrones de Ruptura</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-oneil mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Liderazgo Sectorial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-oneil mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Soporte Institucional</span>
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
                  Valúa empresas con margen de seguridad y fundamentos sólidos
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-graham mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Margen de Seguridad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-graham mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Valuación Conservadora</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-graham mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Dividendos Estables</span>
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
                Funcionalidades Poderosas
              </h2>
              <p className="text-xl text-slate-600">
                Todo lo que necesitas para tomar decisiones de trading informadas
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <LineChart className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Trinity Score en Tiempo Real</h3>
                <p className="text-slate-600">
                  Obtén scores instantáneos del Trinity Method combinando las tres estrategias
                </p>
              </Card>

              <Card>
                <Bell className="w-12 h-12 text-oneil mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Alertas por Email</h3>
                <p className="text-slate-600">
                  Recibe notificaciones cuando se detecten nuevas señales de alta confianza
                </p>
              </Card>

              <Card>
                <Download className="w-12 h-12 text-lynch mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Exportar a Sheets</h3>
                <p className="text-slate-600">
                  Descarga tus señales como CSV para análisis personalizado
                </p>
              </Card>

              <Card>
                <CheckCircle className="w-12 h-12 text-graham mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">500+ Tickers</h3>
                <p className="text-slate-600">
                  Cobertura de las 500 principales acciones de EE.UU. actualizadas diariamente
                </p>
              </Card>

              <Card>
                <TrendingUp className="w-12 h-12 text-success mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Seguimiento de Rendimiento</h3>
                <p className="text-slate-600">
                  Monitorea la precisión histórica y los retornos de nuestras señales
                </p>
              </Card>

              <Card>
                <Activity className="w-12 h-12 text-warning mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Análisis de Régimen de Mercado</h3>
                <p className="text-slate-600">
                  Entiende las condiciones actuales del mercado y ajusta tu estrategia
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
              Comienza a Analizar con Trinity Method
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Únete a miles de traders usando la sabiduría combinada de Lynch, O'Neil y Graham
            </p>
            <Button
              variant="secondary"
              size="lg"
              as="link"
              to="/dashboard"
              className="bg-white text-primary hover:bg-slate-50"
            >
              Ver Señales Ahora
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-white/80 text-sm mt-4">
              No se requiere tarjeta de crédito • Acceso gratuito al TOP 10 Diario
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
