import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiCheck, FiArrowRight, FiDownload, FiMail } from 'react-icons/fi';

const SuccessPage: NextPage = () => {
  const router = useRouter();
  const { session_id, plan, demo, amount, currency } = router.query;
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Verificar se está em modo demo
    if (demo === 'true') {
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    if (session_id) {
      // Verificar detalhes da sessão
      fetchSessionDetails();
    } else {
      setLoading(false);
    }
  }, [session_id, demo]);

  const fetchSessionDetails = async () => {
    try {
      const response = await fetch(`/api/stripe/session?session_id=${session_id}`);
      const data = await response.json();
      
      if (data.success) {
        setSessionDetails(data.session);
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanInfo = (planId: string) => {
    const plans: Record<string, any> = {
      'brasil-flex': {
        name: 'Brasil FLEX',
        description: '20% comissão (sem mensalidade)',
        features: ['Bot MARKETBOT básico', 'Trading 24/7', 'Suporte por email']
      },
      'brasil-pro': {
        name: 'Brasil PRO',
        description: 'R$297/mês + 10% comissão',
        features: ['Bot MARKETBOT completo', 'Trading avançado', 'Suporte prioritário', 'Análise técnica']
      },
      'global-flex': {
        name: 'Global FLEX',
        description: '20% comissão (sem mensalidade)',
        features: ['Trading global', 'Múltiplas exchanges', 'Suporte por email']
      },
      'global-pro': {
        name: 'Global PRO',
        description: 'USD 60/mês + 10% comissão',
        features: ['Trading global completo', 'Análise avançada', 'Suporte 24/7', 'Consultoria']
      }
    };
    return plans[planId] || { name: 'Plano Desconhecido', description: '', features: [] };
  };

  const planInfo = getPlanInfo(plan as string);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-yellow-400 text-xl">Processando pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Pagamento Realizado com Sucesso! | CoinBitClub</title>
        <meta name="description" content="Seu pagamento foi processado com sucesso. Bem-vindo ao CoinBitClub!" />
        <link rel="icon" href="/logo-nova.jpg" />
      </Head>

      <div className="min-h-screen bg-black">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-transparent"></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Success Animation */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <FiCheck className="w-12 h-12 text-white" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                🎉 Pagamento Realizado!
              </h1>
              
              <p className="text-xl text-gray-300 mb-2">
                Bem-vindo ao <span className="text-yellow-400 font-bold">CoinBitClub</span>
              </p>
              
              <p className="text-gray-400">
                Seu plano <span className="text-yellow-400 font-semibold">{planInfo.name}</span> foi ativado com sucesso
              </p>
            </div>

            {/* Plan Details Card */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-yellow-400/20 rounded-2xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Detalhes do Plano</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{planInfo.name}</h3>
                  <p className="text-gray-300 mb-4">{planInfo.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">
                      Recursos Inclusos:
                    </h4>
                    {planInfo.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center text-sm text-gray-300">
                        <FiCheck className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {sessionDetails && (
                    <div className="bg-black/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-2">
                        Informações do Pagamento:
                      </h4>
                      <div className="space-y-1 text-sm text-gray-300">
                        <p>Status: <span className="text-green-400">Aprovado</span></p>
                        <p>ID da Sessão: <span className="text-gray-400 font-mono text-xs">{session_id}</span></p>
                        {sessionDetails.amount_total && (
                          <p>Valor: <span className="text-yellow-400">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: sessionDetails.currency?.toUpperCase() || 'BRL'
                            }).format(sessionDetails.amount_total / 100)}
                          </span></p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
                    <div className="flex items-start">
                      <FiMail className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-400 mb-1">Email de Confirmação</h4>
                        <p className="text-xs text-gray-300">
                          Você receberá um email com os detalhes da compra e instruções de acesso.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border border-yellow-400/30 rounded-2xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">Próximos Passos</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-yellow-400 font-bold">1</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Acesse seu Dashboard</h3>
                  <p className="text-sm text-gray-300">
                    Configure suas preferências de trading e conecte suas exchanges
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-yellow-400 font-bold">2</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Configure o Bot</h3>
                  <p className="text-sm text-gray-300">
                    Defina estratégias, limites de risco e pares de trading
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-yellow-400 font-bold">3</span>
                  </div>
                  <h3 className="font-semibold text-white mb-2">Comece a Lucrar</h3>
                  <p className="text-sm text-gray-300">
                    Monitore seus resultados e aproveite o trading automatizado
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/user/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all transform hover:scale-105 shadow-lg"
              >
                Acessar Dashboard
                <FiArrowRight className="w-5 h-5 ml-2" />
              </Link>
              
              <Link
                href="/support"
                className="inline-flex items-center justify-center px-8 py-4 bg-gray-800 text-white border-2 border-gray-600 hover:border-yellow-400 rounded-xl transition-all font-medium"
              >
                Central de Ajuda
                <FiDownload className="w-5 h-5 ml-2" />
              </Link>
            </div>

            {/* Footer Note */}
            <div className="text-center mt-8">
              <p className="text-sm text-gray-500">
                Tem dúvidas? Entre em contato conosco através do{' '}
                <Link href="/contact" className="text-yellow-400 hover:text-yellow-300">
                  WhatsApp
                </Link>
                {' '}ou{' '}
                <Link href="/contact" className="text-yellow-400 hover:text-yellow-300">
                  email
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuccessPage;
