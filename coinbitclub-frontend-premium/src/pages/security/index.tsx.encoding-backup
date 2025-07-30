import React from 'react';
import Head from 'next/head';
import { FiShield, FiDatabase, FiLock, FiServer, FiKey, FiEye } from 'react-icons/fi';

const SecurityPage = () => {
  const features = [
    {
      icon: <FiLock className="size-8 text-emerald-400" />,
      title: 'Criptografia de Ponta a Ponta',
      description: 'Todos os dados sensíveis, incluindo chaves de API e informações pessoais, são criptografados em trânsito e em repouso usando algoritmos AES-256.',
    },
    {
      icon: <FiKey className="size-8 text-emerald-400" />,
      title: 'Autenticação de Dois Fatores (2FA)',
      description: 'Adicione uma camada extra de segurança à sua conta. O 2FA é obrigatório para todas as operações financeiras e alterações de segurança.',
    },
    {
      icon: <FiDatabase className="size-8 text-emerald-400" />,
      title: 'Segurança de Chaves de API',
      description: 'Suas chaves de API de exchanges são armazenadas em um ambiente seguro e isolado, com acesso restrito e monitorado.',
    },
    {
      icon: <FiServer className="size-8 text-emerald-400" />,
      title: 'Infraestrutura Robusta',
      description: 'Nossos servidores estão hospedados em provedores de nuvem de primeira linha, com proteção contra DDoS e as melhores práticas de segurança de rede.',
    },
    {
      icon: <FiEye className="size-8 text-emerald-400" />,
      title: 'Monitoramento e Auditoria Constante',
      description: 'Nossos sistemas são monitorados 24/7 para detectar atividades suspeitas. Realizamos auditorias de segurança regulares por empresas terceirizadas.',
    },
    {
      icon: <FiShield className="size-8 text-emerald-400" />,
      title: 'Programa de Recompensa por Bugs (Bug Bounty)',
      description: 'Incentivamos a comunicação responsável de vulnerabilidades através do nosso programa de bug bounty, ajudando a manter a plataforma sempre segura.',
    },
  ];

  return (
    <>
      <Head>
        <title>Segurança - CoinbitClub</title>
      </Head>
      <main className="min-h-screen bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <FiShield className="mx-auto size-16 text-emerald-400" />
            <h1 className="mt-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Sua Segurança é Nossa Prioridade
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-400">
              No CoinbitClub, levamos a segurança dos seus ativos e dados muito a sério. Implementamos múltiplas camadas de proteção para garantir que você possa operar com tranquilidade.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 transition-colors duration-300 hover:border-emerald-500">
                <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-emerald-500/10">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>

           <div className="mt-20 rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
              <h2 className="text-2xl font-bold text-white">Dúvidas ou Relatos?</h2>
              <p className="mt-4 text-slate-400">
                Se você tiver qualquer dúvida sobre nossas práticas de segurança ou suspeitar de alguma vulnerabilidade, entre em contato imediatamente com nossa equipe de segurança.
              </p>
              <a
                href="mailto:security@coinbit.club"
                className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-3 font-bold text-white transition-colors duration-300 hover:bg-emerald-700"
              >
                Contatar Segurança
              </a>
            </div>

        </div>
      </main>
    </>
  );
};

export default SecurityPage;
