import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const CompliancePage = () => {
  return (
    <>
      <Head>
        <title>Compliance - CoinbitClub</title>
      </Head>
      <main className="min-h-screen bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Compliance
            </h1>
            <p className="mt-4 text-lg text-slate-400">Nosso compromisso com a conformidade regulatória.</p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none text-slate-300">
            <p>
              O CoinbitClub está empenhado em operar de acordo com as leis e regulamentações aplicáveis. Como uma plataforma de software (SaaS), não operamos como uma exchange ou instituição financeira.
            </p>

            <h2>Anti-Lavagem de Dinheiro (AML) e Conheça seu Cliente (KYC)</h2>
            <p>
              Embora não tenhamos custódia de fundos, promovemos um ambiente de negociação seguro. Os procedimentos de AML e KYC são de responsabilidade das exchanges parceiras onde os fundos dos usuários estão localizados. Incentivamos todos os nossos usuários a completarem a verificação em suas respectivas exchanges.
            </p>

            <h2>Proteção de Dados</h2>
            <p>
              Nossas práticas de coleta e gerenciamento de dados estão alinhadas com os principais regulamentos de privacidade, como o GDPR. Para mais detalhes, consulte nossa <Link href="/privacy">Política de Privacidade</Link>.
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default CompliancePage;
