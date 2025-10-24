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
      name: 'Gratis',
      description: 'Perfecto para explorar el Trinity Method',
      priceMonthly: 0,
      priceYearly: 0,
      popular: false,
      features: [
        'TOP 10 Señales Diarias',
        'Scoring básico del Trinity Method',
        'Indicador de régimen de mercado',
        'Exportar a CSV',
        'Soporte por email',
        'Diseño responsive en móvil'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Para inversores serios',
      priceMonthly: 39,
      priceYearly: 390,
      popular: true,
      features: [
        'Todo lo de Gratis',
        'Acceso completo TOP 500 Señales',
        'Filtros y búsqueda avanzados',
        'Watchlist con señales ilimitadas',
        'Alertas de precios y notificaciones',
        'Datos históricos (6 meses)',
        'Soporte prioritario por email',
        'Trinity Triangle charts',
        'Pesos personalizados por autor'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Para traders profesionales',
      priceMonthly: 79,
      priceYearly: 790,
      popular: false,
      features: [
        'Todo lo de Pro',
        'Datos históricos completos (3+ años)',
        'Acceso API para automatización',
        'Actualizaciones de señales en tiempo real',
        'Indicadores personalizados y backtesting',
        'Seguimiento y análisis de portafolio',
        'Opciones white-label',
        'Soporte prioritario por teléfono y chat',
        'Account Manager dedicado',
        'Reportes y exportaciones personalizadas'
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
            Elige Tu Plan
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Comienza con nuestro plan gratuito y actualiza a medida que creces. Todos los planes incluyen acceso a las señales del Trinity Method.
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
              Mensual
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors relative ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Anual
              <span className="absolute -top-2 -right-2 bg-buy text-white text-xs px-2 py-0.5 rounded-full">
                Ahorra 17%
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
                    Más Popular
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
                    <span className="text-slate-600">/mes</span>
                  </div>
                  {billingPeriod === 'yearly' && plan.priceMonthly > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-slate-600">
                        ${getTotalPrice(plan)}/año
                      </p>
                      <p className="text-sm text-buy font-semibold">
                        Ahorra {getSavings(plan)}%
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
                    {plan.priceMonthly === 0 ? 'Comenzar Gratis' : `Iniciar Plan ${plan.name}`}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Preguntas Frecuentes
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                ¿Puedo cambiar de plan en cualquier momento?
              </h3>
              <p className="text-slate-600 text-sm">
                Sí, puedes actualizar o bajar de plan en cualquier momento. Los cambios toman efecto inmediatamente, y prorrateamos cualquier diferencia.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                ¿Hay prueba gratuita?
              </h3>
              <p className="text-slate-600 text-sm">
                Nuestro plan Gratis te da acceso completo a las señales del TOP 10 Diario sin requerir tarjeta de crédito. Actualiza en cualquier momento para desbloquear más funcionalidades.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                ¿Qué métodos de pago aceptan?
              </h3>
              <p className="text-slate-600 text-sm">
                Aceptamos todas las tarjetas de crédito principales (Visa, Mastercard, Amex), PayPal, y transferencias bancarias para suscripciones anuales.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                ¿Puedo cancelar en cualquier momento?
              </h3>
              <p className="text-slate-600 text-sm">
                Sí, puedes cancelar tu suscripción en cualquier momento sin penalidades. Tu acceso continúa hasta el final de tu período de facturación.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                ¿Qué es el Trinity Method?
              </h3>
              <p className="text-slate-600 text-sm">
                El Trinity Method combina la inversión de crecimiento de Peter Lynch, el trading de momentum de William O'Neil, y la inversión de valor de Benjamin Graham en un poderoso sistema de scoring.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                ¿Ofrecen reembolsos?
              </h3>
              <p className="text-slate-600 text-sm">
                Sí, ofrecemos una garantía de devolución de dinero de 30 días en todos los planes pagos. Si no estás satisfecho, contacta a soporte para un reembolso completo.
              </p>
            </div>
          </div>
        </Card>

        {/* Final CTA */}
        <div className="text-center py-12 px-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            ¿Listo para invertir más inteligentemente?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Únete a miles de inversores usando el Trinity Method para tomar mejores decisiones de inversión.
          </p>
          <Link to="/register">
            <Button variant="primary" className="px-8 py-3 text-lg">
              Comienza Gratis Hoy
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
