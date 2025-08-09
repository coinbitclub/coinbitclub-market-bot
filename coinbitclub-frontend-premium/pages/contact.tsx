import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiMail, FiMessageCircle, FiPhone, FiMapPin, FiSend, FiUser } from 'react-icons/fi';

const ContactPage: NextPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você pode implementar o envio do formulário
    const whatsappMessage = `Olá! Meu nome é ${formData.name}. ${formData.message}`;
    const whatsappURL = `https://wa.me/5521995966652?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappURL, '_blank');
  };

  return (
    <div>
      <Head>
        <title>Contato - CoinBitClub MARKETBOT</title>
        <meta name="description" content="Entre em contato conosco. Estamos aqui para ajudar com suas dúvidas sobre o CoinBitClub MARKETBOT." />
        <link rel="icon" href="/logo-nova.jpg" />
        <link rel="apple-touch-icon" href="/logo-nova.jpg" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="inline-flex items-center text-yellow-400 hover:text-yellow-300 transition-colors">
              <FiArrowLeft className="w-5 h-5 mr-2" />
              Voltar ao Início
            </Link>
            <div className="flex items-center space-x-3">
              <FiMail className="w-8 h-8 text-yellow-400" />
              <h1 className="text-3xl font-bold text-white">Contato</h1>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Informações de Contato */}
            <div className="bg-black/40 backdrop-blur-sm border border-yellow-400/20 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">Fale Conosco</h2>
              <p className="text-gray-300 mb-8">
                Estamos aqui para ajudar! Entre em contato conosco através dos canais abaixo 
                ou envie uma mensagem usando o formulário ao lado.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-yellow-400/20 p-3 rounded-lg">
                    <FiMessageCircle className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-2">WhatsApp</h3>
                    <p className="text-gray-300 mb-2">Para suporte rápido e personalizado</p>
                    <a 
                      href="https://wa.me/5521995966652" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors"
                    >
                      +55 21 99596-6652
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-yellow-400/20 p-3 rounded-lg">
                    <FiMail className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-2">Email</h3>
                    <p className="text-gray-300 mb-2">Para dúvidas detalhadas ou suporte técnico</p>
                    <a 
                      href="mailto:faleconosco@coinbitclub.vip"
                      className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors"
                    >
                      faleconosco@coinbitclub.vip
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-yellow-400/20 p-3 rounded-lg">
                    <FiPhone className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-2">Horário de Atendimento</h3>
                    <p className="text-gray-300 mb-1">Segunda a Sexta: 9h às 18h</p>
                    <p className="text-gray-300">Sábado: 9h às 14h</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-yellow-400/20 p-3 rounded-lg">
                    <FiMapPin className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-2">Localização</h3>
                    <p className="text-gray-300">Rio de Janeiro, Brasil</p>
                    <p className="text-gray-300">Atendimento 100% digital</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border border-yellow-400/30 rounded-lg">
                <h3 className="text-yellow-400 font-bold mb-2">⚡ Suporte Prioritário</h3>
                <p className="text-gray-300 text-sm">
                  Usuários Premium têm acesso ao suporte prioritário via WhatsApp 
                  com tempo de resposta de até 1 hora durante o horário comercial.
                </p>
              </div>
            </div>

            {/* Formulário de Contato */}
            <div className="bg-black/40 backdrop-blur-sm border border-yellow-400/20 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">Envie uma Mensagem</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-white font-bold mb-2">
                    <FiUser className="w-4 h-4 inline mr-2" />
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">
                    <FiMail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">
                    Assunto
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white focus:border-yellow-400/70 focus:outline-none transition-colors"
                    required
                  >
                    <option value="">Selecione um assunto</option>
                    <option value="suporte">Suporte Técnico</option>
                    <option value="duvidas">Dúvidas sobre Planos</option>
                    <option value="parceria">Parcerias</option>
                    <option value="bug">Reportar Bug</option>
                    <option value="sugestao">Sugestão</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    rows={5}
                    className="w-full px-4 py-3 bg-black/50 border border-yellow-400/30 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400/70 focus:outline-none transition-colors resize-none"
                    placeholder="Descreva sua dúvida ou solicitação..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 px-6 rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <FiSend className="w-5 h-5" />
                  <span>Enviar via WhatsApp</span>
                </button>

                <p className="text-gray-400 text-sm text-center">
                  Ao clicar em "Enviar", você será redirecionado para o WhatsApp 
                  com sua mensagem pré-formatada para envio direto.
                </p>
              </form>
            </div>
          </div>

          {/* FAQ Rápido */}
          <div className="mt-12 bg-black/40 backdrop-blur-sm border border-yellow-400/20 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Perguntas Frequentes</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-white font-bold mb-2">Como funciona o período de teste?</h3>
                <p className="text-gray-300 text-sm">
                  Você tem 7 dias grátis para testar nossa plataforma sem nenhum custo. 
                  Após o período, cobramos apenas comissão sobre os lucros obtidos.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold mb-2">Posso cancelar a qualquer momento?</h3>
                <p className="text-gray-300 text-sm">
                  Sim! Você pode cancelar sua assinatura a qualquer momento sem taxas de cancelamento. 
                  Entre em contato conosco e processaremos imediatamente.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold mb-2">Como funciona a cobrança?</h3>
                <p className="text-gray-300 text-sm">
                  Só cobramos comissão quando você lucra! Se não houver lucro, 
                  não há cobrança. Transparência total em todos os cálculos.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold mb-2">Qual o tempo de resposta do suporte?</h3>
                <p className="text-gray-300 text-sm">
                  WhatsApp: até 2 horas no horário comercial. Email: até 24 horas. 
                  Usuários Premium têm suporte prioritário com resposta em até 1 hora.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
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
  );
};

export default ContactPage;
