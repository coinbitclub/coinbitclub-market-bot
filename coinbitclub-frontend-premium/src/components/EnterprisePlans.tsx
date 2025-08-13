/**
 * COMPONENTE DE PLANOS ENTERPRISE
 * CoinBitClub Market Bot v6.0.0 Enterprise
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_period: string;
  features: string[];
  region: string;
  is_popular: boolean;
  stripe_price_id: string;
}

interface PricingRegion {
  code: string;
  name: string;
  currency: string;
  flag: string;
}

const REGIONS: PricingRegion[] = [
  { code: 'brazil', name: 'Brasil', currency: 'BRL', flag: '🇧🇷' },
  { code: 'global', name: 'Global', currency: 'USD', flag: '🌍' }
];

export default function EnterprisePlans() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('brazil');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, [selectedRegion]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/enterprise/plans?region=${selectedRegion}`);
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      } else {
        console.error('Erro ao carregar planos');
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planCode: string) => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    setSubscribing(planCode);

    try {
      const response = await fetch('/api/enterprise/subscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planCode,
          successUrl: `${window.location.origin}/enterprise/success`,
          cancelUrl: `${window.location.origin}/enterprise/plans`
        }),
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        // Redirecionar para o Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Erro ao criar checkout');
      }
    } catch (error) {
      console.error('Erro na assinatura:', error);
      alert('Erro de conexão');
    } finally {
      setSubscribing(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const selectedRegionData = REGIONS.find(r => r.code === selectedRegion);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Planos Enterprise
            </h1>
            <p className="text-xl text-gray-600">
              Escolha o plano ideal para suas necessidades de trading
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Seletor de Região */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Selecione sua região:
          </h3>
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            {REGIONS.map((region) => (
              <button
                key={region.code}
                onClick={() => setSelectedRegion(region.code)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedRegion === region.code
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {region.flag} {region.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando planos...</p>
          </div>
        ) : (
          <>
            {/* Grid de Planos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                    plan.is_popular 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {/* Badge Popular */}
                  {plan.is_popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        🔥 Mais Popular
                      </div>
                    </div>
                  )}

                  <div className="p-8">
                    {/* Cabeçalho do Plano */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {plan.description}
                      </p>
                      
                      {/* Preço */}
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-gray-900">
                          {formatPrice(plan.price, plan.currency)}
                        </span>
                        <span className="text-gray-600 ml-2">
                          /{plan.billing_period}
                        </span>
                      </div>

                      {/* Região e Moeda */}
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                        {selectedRegionData?.flag} {plan.currency}
                      </div>
                    </div>

                    {/* Lista de Recursos */}
                    <div className="mb-8">
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-3 mt-1">✓</span>
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Botão de Assinatura */}
                    <button
                      onClick={() => handleSubscribe(plan.code)}
                      disabled={subscribing === plan.code}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        plan.is_popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                          : 'bg-gray-800 text-white hover:bg-gray-900 disabled:bg-gray-400'
                      }`}
                    >
                      {subscribing === plan.code ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processando...
                        </div>
                      ) : (
                        'Assinar Agora'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Seção de Comparação Detalhada */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Comparação Detalhada dos Planos
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 font-medium text-gray-900">
                        Recursos
                      </th>
                      {plans.map((plan) => (
                        <th key={plan.id} className="text-center py-4 px-4 font-medium text-gray-900">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Comparar recursos únicos */}
                    {[
                      'Sinais de Trading',
                      'Suporte Técnico',
                      'Dashboard Analytics',
                      'API Access',
                      'Multi-usuários',
                      'Relatórios Avançados',
                      'Consultoria Personalizada',
                      'Priority Support'
                    ].map((feature) => (
                      <tr key={feature} className="border-b border-gray-100">
                        <td className="py-4 px-4 font-medium text-gray-700">
                          {feature}
                        </td>
                        {plans.map((plan) => (
                          <td key={plan.id} className="text-center py-4 px-4">
                            {plan.features.some(f => f.toLowerCase().includes(feature.toLowerCase())) ? (
                              <span className="text-green-500 text-xl">✓</span>
                            ) : (
                              <span className="text-gray-300 text-xl">✗</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Perguntas Frequentes
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    🔒 Como funciona o pagamento?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Utilizamos o Stripe para processamento seguro de pagamentos. 
                    Aceitamos cartões de crédito e débito principais.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    ⏰ Posso cancelar a qualquer momento?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Sim, você pode cancelar sua assinatura a qualquer momento 
                    através do painel de controle.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    📊 Existe período de teste?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Oferecemos 7 dias de garantia. Se não ficar satisfeito, 
                    reembolsamos 100% do valor pago.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    🌟 Posso fazer upgrade depois?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Sim, você pode fazer upgrade do seu plano a qualquer momento. 
                    O valor será ajustado proporcionalmente.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Final */}
            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">
                  Pronto para começar?
                </h3>
                <p className="text-lg mb-6 opacity-90">
                  Junte-se a milhares de traders que já escolheram o CoinBitClub Enterprise
                </p>
                <button
                  onClick={() => router.push('/enterprise/register')}
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Criar Conta Grátis
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
