import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiFileText, FiShield } from 'react-icons/fi';

const TermsPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Termos de Uso - CoinBitClub MARKETBOT</title>
        <meta name="description" content="Leia nossos Termos de Uso para entender as condições de utilização da plataforma CoinBitClub MARKETBOT." />
        <link rel="icon" href="/logo-nova.jpg" />
        <link rel="apple-touch-icon" href="/logo-nova.jpg" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="inline-flex items-center text-yellow-400 hover:text-yellow-300 transition-colors">
              <FiArrowLeft className="w-5 h-5 mr-2" />
              Voltar ao Início
            </Link>
            <div className="flex items-center space-x-3">
              <FiFileText className="w-8 h-8 text-yellow-400" />
              <h1 className="text-3xl font-bold text-white">Termos de Uso</h1>
            </div>
          </div>

          {/* Content */}
          <div className="bg-black/40 backdrop-blur-sm border border-yellow-400/20 rounded-xl p-8">
            <div className="prose prose-invert max-w-none">
              <div className="mb-8 p-6 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                <div className="flex items-center mb-4">
                  <FiShield className="w-6 h-6 text-yellow-400 mr-3" />
                  <h2 className="text-xl font-bold text-yellow-400 m-0">Informações Importantes</h2>
                </div>
                <p className="text-gray-300 mb-0">
                  Estes Termos de Uso estabelecem as condições para utilização da plataforma CoinBitClub MARKETBOT. 
                  Ao acessar ou usar nossos serviços, você concorda em cumprir estes termos.
                </p>
              </div>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">1. Definições</h2>
                <p className="text-gray-300 mb-4">
                  Para os fins destes Termos de Uso, consideramos:
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li><strong className="text-yellow-400">Plataforma:</strong> O sistema CoinBitClub MARKETBOT, incluindo todas as funcionalidades de trading automatizado.</li>
                  <li><strong className="text-yellow-400">Usuário:</strong> Qualquer pessoa física ou jurídica que utilize nossos serviços.</li>
                  <li><strong className="text-yellow-400">Bot:</strong> Software automatizado para execução de operações de trading.</li>
                  <li><strong className="text-yellow-400">Conta:</strong> Registro individual do usuário na plataforma.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">2. Serviços Oferecidos</h2>
                <p className="text-gray-300 mb-4">
                  A CoinBitClub oferece uma plataforma de trading automatizado com as seguintes características:
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li>• Sistema de trading automatizado via bot MARKETBOT</li>
                  <li>• Monitoramento de mercado com inteligência artificial</li>
                  <li>• Sinais de entrada e saída automatizados</li>
                  <li>• Dashboard de acompanhamento de resultados</li>
                  <li>• Suporte técnico especializado</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">3. Responsabilidades do Usuário</h2>
                <p className="text-gray-300 mb-4">
                  Ao utilizar nossa plataforma, o usuário se compromete a:
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li>• Fornecer informações verdadeiras e atualizadas</li>
                  <li>• Manter a confidencialidade de suas credenciais</li>
                  <li>• Usar a plataforma de acordo com as leis aplicáveis</li>
                  <li>• Não interferir no funcionamento do sistema</li>
                  <li>• Entender os riscos inerentes ao trading</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">4. Limitações e Riscos</h2>
                <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-6 mb-4">
                  <h3 className="text-red-400 font-bold mb-2">⚠️ Aviso Importante sobre Riscos</h3>
                  <p className="text-gray-300">
                    O trading de criptomoedas envolve riscos significativos. Os resultados passados não garantem 
                    resultados futuros. Você pode perder parte ou todo o seu capital investido.
                  </p>
                </div>
                <ul className="text-gray-300 space-y-2">
                  <li>• A plataforma não garante lucros</li>
                  <li>• Operações podem resultar em perdas</li>
                  <li>• Volatilidade do mercado de criptomoedas</li>
                  <li>• Riscos técnicos e de conectividade</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">5. Planos e Pagamentos</h2>
                <ul className="text-gray-300 space-y-2">
                  <li>• Cobrança de comissão apenas sobre lucros obtidos</li>
                  <li>• Período de teste gratuito conforme plano escolhido</li>
                  <li>• Cancelamento pode ser feito a qualquer momento</li>
                  <li>• Transparência total nos cálculos de comissão</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">6. Propriedade Intelectual</h2>
                <p className="text-gray-300">
                  Todos os direitos de propriedade intelectual da plataforma, incluindo algoritmos, 
                  interface e documentação, pertencem à CoinBitClub. É proibida a reprodução, 
                  modificação ou distribuição sem autorização expressa.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">7. Modificações dos Termos</h2>
                <p className="text-gray-300">
                  Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                  As alterações serão comunicadas através da plataforma e entrarão em vigor 
                  imediatamente após a publicação.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">8. Contato</h2>
                <p className="text-gray-300">
                  Para dúvidas sobre estes Termos de Uso, entre em contato:
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li>• Email: faleconosco@coinbitclub.vip</li>
                  <li>• WhatsApp: +55 21 99596-6652</li>
                  <li>• Website: www.coinbitclub.vip</li>
                </ul>
              </section>

              <div className="text-center pt-8 border-t border-yellow-400/20">
                <p className="text-gray-400 text-sm">
                  Última atualização: 1° de agosto de 2025
                </p>
                <p className="text-yellow-400 font-bold mt-2">
                  ⚡ CoinBitClub MARKETBOT ⚡
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
