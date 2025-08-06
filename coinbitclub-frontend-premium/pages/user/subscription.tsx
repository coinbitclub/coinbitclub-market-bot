import React, { useState } from 'react';
import Head from 'next/head';
import { FiCreditCard, FiCheck, FiStar } from 'react-icons/fi';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

const PlansPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Básico', 
      price: 97,
      features: [
        'Até 5 operações simultâneas',
        'Suporte básico',
        'Relatórios mensais'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 197,
      features: [
        'Operações ilimitadas',
        'Suporte prioritário', 
        'Relatórios em tempo real',
        'API avançada'
      ],
      recommended: true
    }
  ];

  return (
    <>
      <Head>
        <title>Planos - CoinBitClub Premium</title>
      </Head>

      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-8">Escolha seu Plano</h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`relative bg-zinc-900 rounded-lg p-8 border ${
                  plan.recommended ? 'border-blue-500' : 'border-zinc-700'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Recomendado
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-blue-400">
                    ${plan.price}
                    <span className="text-lg text-zinc-400">/mês</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <FiCheck className="text-green-500 mr-3" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.recommended
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600'
                  }`}
                  onClick={() => setLoading(true)}
                  disabled={loading}
                >
                  <FiCreditCard className="inline mr-2" size={16} />
                  Assinar Agora
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PlansPage;
