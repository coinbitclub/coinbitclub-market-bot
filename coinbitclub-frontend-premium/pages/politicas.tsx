import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiFileText, 
  FiShield, 
  FiAlertCircle,
  FiCheckCircle,
  FiLock,
  FiEye,
  FiDatabase
} from 'react-icons/fi';

const PoliticasPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState<'termos' | 'privacidade'>('termos');

  return (
    <div>
      <Head>
        <title>Termos de Uso e Política de Privacidade - CoinBitClub MARKETBOT</title>
        <meta name="description" content="Leia nossos Termos de Uso e Política de Privacidade para entender como protegemos seus dados e direitos." />
        <link rel="icon" href="/logo-nova.jpg" />
        <link rel="apple-touch-icon" href="/logo-nova.jpg" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/logo-nova.jpg" 
                alt="CoinBitClub MARKETBOT" 
                className="h-12 w-12 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-xl font-bold text-white">CoinBitClub</h1>
                <p className="text-sm text-yellow-400">MARKETBOT</p>
              </div>
            </Link>
            
            <Link href="/" className="inline-flex items-center text-yellow-400 hover:text-yellow-300 transition-colors">
              <FiArrowLeft className="w-5 h-5 mr-2" />
              Voltar para Home
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Políticas e <span className="text-yellow-400">Termos</span>
            </h1>
            <p className="text-xl text-gray-300">
              Transparência total sobre como operamos e protegemos você
            </p>
          </motion.div>

          {/* Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex mb-8"
          >
            <button
              onClick={() => setActiveTab('termos')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all rounded-l-lg border ${
                activeTab === 'termos'
                  ? 'bg-yellow-400 text-black border-yellow-400'
                  : 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800'
              }`}
            >
              <FiFileText className="w-5 h-5 inline mr-2" />
              Termos de Uso
            </button>
            <button
              onClick={() => setActiveTab('privacidade')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all rounded-r-lg border ${
                activeTab === 'privacidade'
                  ? 'bg-yellow-400 text-black border-yellow-400'
                  : 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800'
              }`}
            >
              <FiShield className="w-5 h-5 inline mr-2" />
              Política de Privacidade
            </button>
          </motion.div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-gray-900/50 border border-gray-700 rounded-xl p-8"
          >
            {activeTab === 'termos' ? (
              <div className="prose prose-invert max-w-none">
                <div className="flex items-center mb-6">
                  <FiFileText className="w-8 h-8 text-yellow-400 mr-3" />
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Termos de Uso</h2>
                    <p className="text-gray-400 text-sm">Última atualização: Janeiro 2024</p>
                  </div>
                </div>

                <div className="space-y-8 text-gray-300">
                  {/* Seção 1 */}
                  <section>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <FiCheckCircle className="w-5 h-5 text-green-400 mr-2" />
                      1. Aceitação dos Termos
                    </h3>
                    <p className="mb-4">
                      Ao utilizar os serviços do CoinBitClub MARKETBOT ("Serviço", "nós", "nosso"), você concorda com estes Termos de Uso. 
                      Se você não concorda com qualquer parte destes termos, não deve usar nosso serviço.
                    </p>
                    <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4">
                      <div className="flex items-start">
                        <FiAlertCircle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-yellow-300 font-medium mb-1">Importante:</p>
                          <p className="text-yellow-200 text-sm">
                            Trading de criptomoedas envolve riscos significativos. Você pode perder todo o capital investido.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Seção 2 */}
                  <section>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <FiShield className="w-5 h-5 text-blue-400 mr-2" />
                      2. Descrição do Serviço
                    </h3>
                    <p className="mb-4">
                      O MARKETBOT é um sistema de trading automatizado que utiliza inteligência artificial para:
                    </p>
                    <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                      <li>Analisar mercados de criptomoedas em tempo real</li>
                      <li>Executar operações automatizadas baseadas em algoritmos</li>
                      <li>Gerenciar riscos através de stop loss e take profit</li>
                      <li>Fornecer relatórios e análises de performance</li>
                    </ul>
                    <p className="text-sm text-gray-400">
                      <strong>Aviso:</strong> Nosso serviço não constitui aconselhamento financeiro. Todas as decisões de investimento são de sua responsabilidade.
                    </p>
                  </section>

                  {/* Seção 3 */}
                  <section>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <FiLock className="w-5 h-5 text-purple-400 mr-2" />
                      3. Segurança e Custódia
                    </h3>
                    <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <FiCheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-green-300 font-medium mb-1">Seus fundos estão seguros:</p>
                          <p className="text-green-200 text-sm">
                            Nunca temos acesso aos seus fundos. Tudo fica na sua exchange, conectamos apenas via API para trading.
                          </p>
                        </div>
                      </div>
                    </div>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Não armazenamos chaves privadas ou senhas de exchanges</li>
                      <li>Utilizamos apenas APIs de trading (sem retirada)</li>
                      <li>Você mantém controle total dos seus ativos</li>
                      <li>Pode desconectar o bot a qualquer momento</li>
                    </ul>
                  </section>

                  {/* Seção 4 */}
                  <section>
                    <h3 className="text-xl font-bold text-white mb-4">4. Modelo de Cobrança</h3>
                    <p className="mb-4">
                      Nosso modelo de cobrança é transparente e alinhado aos seus resultados:
                    </p>
                    <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                      <li><strong>Taxa de Performance:</strong> 1,5% sobre o lucro real gerado</li>
                      <li><strong>Sem taxa fixa:</strong> Você só paga se lucrar</li>
                      <li><strong>Teste gratuito:</strong> 7 dias sem cobrança</li>
                      <li><strong>Cancelamento:</strong> Pode cancelar a qualquer momento</li>
                    </ul>
                  </section>

                  {/* Seção 5 */}
                  <section>
                    <h3 className="text-xl font-bold text-white mb-4">5. Limitações e Responsabilidades</h3>
                    <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <FiAlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-red-300 font-medium mb-1">Isenção de Responsabilidade:</p>
                          <p className="text-red-200 text-sm">
                            O trading automatizado não garante lucros. Perdas são possíveis e fazem parte do trading.
                          </p>
                        </div>
                      </div>
                    </div>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Não garantimos resultados específicos</li>
                      <li>Você é responsável por suas decisões de investimento</li>
                      <li>Recomendamos investir apenas o que pode perder</li>
                      <li>Nossa responsabilidade é limitada ao valor pago pelos serviços</li>
                    </ul>
                  </section>

                  {/* Seção 6 */}
                  <section>
                    <h3 className="text-xl font-bold text-white mb-4">6. Modificações e Cancelamento</h3>
                    <p className="mb-4">
                      Você pode cancelar sua assinatura a qualquer momento através do dashboard ou entrando em contato conosco. 
                      O cancelamento será efetivo no final do período de cobrança atual.
                    </p>
                    <p className="text-sm text-gray-400">
                      Reservamo-nos o direito de modificar estes termos mediante aviso prévio de 30 dias.
                    </p>
                  </section>

                  {/* Contato */}
                  <section className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Precisa de Ajuda?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-300 mb-2">WhatsApp Suporte:</p>
                        <a href="https://wa.me/5511999999999" className="text-yellow-400 hover:text-yellow-300">
                          +55 11 99999-9999
                        </a>
                      </div>
                      <div>
                        <p className="text-gray-300 mb-2">Email:</p>
                        <a href="mailto:legal@coinbitclub.com" className="text-yellow-400 hover:text-yellow-300">
                          legal@coinbitclub.com
                        </a>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <div className="flex items-center mb-6">
                  <FiShield className="w-8 h-8 text-yellow-400 mr-3" />
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Política de Privacidade</h2>
                    <p className="text-gray-400 text-sm">Última atualização: Janeiro 2024</p>
                  </div>
                </div>

                <div className="space-y-8 text-gray-300">
                  {/* Seção 1 */}
                  <section>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <FiDatabase className="w-5 h-5 text-blue-400 mr-2" />
                      1. Informações que Coletamos
                    </h3>
                    <p className="mb-4">
                      Coletamos apenas as informações necessárias para fornecer nossos serviços:
                    </p>
                    
                    <h4 className="font-semibold text-white mb-2">Informações Pessoais:</h4>
                    <ul className="list-disc list-inside space-y-1 mb-4 ml-4">
                      <li>Nome completo</li>
                      <li>Endereço de email</li>
                      <li>Número de telefone/WhatsApp</li>
                      <li>País de residência</li>
                    </ul>

                    <h4 className="font-semibold text-white mb-2">Dados de Trading:</h4>
                    <ul className="list-disc list-inside space-y-1 mb-4 ml-4">
                      <li>Histórico de operações (para relatórios)</li>
                      <li>Performance do bot</li>
                      <li>Configurações de trading</li>
                      <li>Dados de uso da plataforma</li>
                    </ul>

                    <div className="bg-blue-400/10 border border-blue-400/30 rounded-lg p-4">
                      <div className="flex items-start">
                        <FiLock className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-blue-300 font-medium mb-1">Nunca coletamos:</p>
                          <p className="text-blue-200 text-sm">
                            Chaves privadas, senhas de exchanges, ou qualquer informação que dê acesso aos seus fundos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Seção 2 */}
                  <section>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <FiEye className="w-5 h-5 text-green-400 mr-2" />
                      2. Como Usamos suas Informações
                    </h3>
                    <p className="mb-4">
                      Utilizamos suas informações exclusivamente para:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Fornecer e manter nossos serviços de trading automatizado</li>
                      <li>Enviar relatórios de performance e alertas</li>
                      <li>Oferecer suporte técnico quando necessário</li>
                      <li>Melhorar nossos algoritmos e serviços</li>
                      <li>Cumprir obrigações legais e regulatórias</li>
                    </ul>
                  </section>

                  {/* Seção 3 */}
                  <section>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <FiShield className="w-5 h-5 text-purple-400 mr-2" />
                      3. Proteção de Dados
                    </h3>
                    <p className="mb-4">
                      Implementamos medidas de segurança rigorosas:
                    </p>
                    <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                      <li>Criptografia SSL/TLS para todas as comunicações</li>
                      <li>Armazenamento seguro com criptografia de dados</li>
                      <li>Acesso restrito apenas para equipe autorizada</li>
                      <li>Monitoramento contínuo de segurança</li>
                      <li>Backups seguros e regulares</li>
                    </ul>
                    
                    <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-4">
                      <div className="flex items-start">
                        <FiCheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-green-300 font-medium mb-1">Conformidade LGPD:</p>
                          <p className="text-green-200 text-sm">
                            Estamos em total conformidade com a Lei Geral de Proteção de Dados (LGPD).
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Seção 4 */}
                  <section>
                    <h3 className="text-xl font-bold text-white mb-4">4. Compartilhamento de Informações</h3>
                    <p className="mb-4">
                      <strong>Não vendemos, alugamos ou compartilhamos</strong> suas informações pessoais com terceiros, exceto:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Quando exigido por lei ou autoridades competentes</li>
                      <li>Para provedores de serviços essenciais (com contratos de confidencialidade)</li>
                      <li>Com seu consentimento explícito</li>
                    </ul>
                  </section>

                  {/* Seção 5 */}
                  <section>
                    <h3 className="text-xl font-bold text-white mb-4">5. Seus Direitos</h3>
                    <p className="mb-4">
                      Você tem o direito de:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Acessar seus dados pessoais</li>
                        <li>Corrigir informações incorretas</li>
                        <li>Solicitar exclusão de dados</li>
                        <li>Portabilidade de dados</li>
                      </ul>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Restringir o processamento</li>
                        <li>Revogar consentimento</li>
                        <li>Apresentar reclamações</li>
                        <li>Ser informado sobre vazamentos</li>
                      </ul>
                    </div>
                  </section>

                  {/* Seção 6 */}
                  <section>
                    <h3 className="text-xl font-bold text-white mb-4">6. Retenção de Dados</h3>
                    <p className="mb-4">
                      Mantemos seus dados apenas pelo tempo necessário:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Dados de conta:</strong> Enquanto for usuário ativo</li>
                      <li><strong>Dados de trading:</strong> 5 anos para fins fiscais</li>
                      <li><strong>Logs de sistema:</strong> 12 meses para segurança</li>
                      <li><strong>Dados de suporte:</strong> 3 anos após o último contato</li>
                    </ul>
                  </section>

                  {/* Seção 7 */}
                  <section>
                    <h3 className="text-xl font-bold text-white mb-4">7. Cookies e Tecnologias</h3>
                    <p className="mb-4">
                      Utilizamos cookies apenas para:
                    </p>
                    <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                      <li>Manter você logado na plataforma</li>
                      <li>Personalizar sua experiência</li>
                      <li>Analisar uso da plataforma (dados anonimizados)</li>
                      <li>Garantir segurança e prevenir fraudes</li>
                    </ul>
                    <p className="text-sm text-gray-400">
                      Você pode desabilitar cookies nas configurações do seu navegador, mas isso pode afetar o funcionamento da plataforma.
                    </p>
                  </section>

                  {/* Contato */}
                  <section className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Dúvidas sobre Privacidade?</h3>
                    <p className="mb-4 text-gray-300">
                      Para exercer seus direitos ou esclarecer dúvidas sobre privacidade:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-300 mb-2">Email Privacidade:</p>
                        <a href="mailto:privacidade@coinbitclub.com" className="text-yellow-400 hover:text-yellow-300">
                          privacidade@coinbitclub.com
                        </a>
                      </div>
                      <div>
                        <p className="text-gray-300 mb-2">WhatsApp:</p>
                        <a href="https://wa.me/5511999999999" className="text-yellow-400 hover:text-yellow-300">
                          +55 11 99999-9999
                        </a>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PoliticasPage;
