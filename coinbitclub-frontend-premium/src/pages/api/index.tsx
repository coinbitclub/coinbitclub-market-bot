import React from 'react';
import Head from 'next/head';

const ApiPage = () => {
  return (
    <>
      <Head>
        <title>API - CoinbitClub</title>
      </Head>
      <main className="min-h-screen bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Documentação da API
            </h1>
            <p className="mt-4 text-lg text-slate-400">Integre seus sistemas com o poder do CoinbitClub.</p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none text-slate-300">
            <p>
              Nossa API RESTful oferece acesso programático aos recursos da nossa plataforma, permitindo que você crie integrações personalizadas, automatize tarefas e extraia dados em tempo real.
            </p>
            
            <h2>Autenticação</h2>
            <p>
              A autenticação é feita através de chaves de API que podem ser geradas no seu painel de usuário. Mantenha suas chaves seguras e nunca as exponha no lado do cliente.
            </p>

            <h2>Endpoints Principais</h2>
            <ul>
              <li><code>GET /api/v1/bots</code> - Lista todos os seus robôs de trading ativos.</li>
              <li><code>POST /api/v1/bots</code> - Cria um novo robô de trading.</li>
              <li><code>GET /api/v1/strategies</code> - Retorna uma lista de estratégias disponíveis.</li>
              <li><code>GET /api/v1/performance</code> - Obtém dados de performance do seu portfólio.</li>
            </ul>

            <h2>Rate Limiting</h2>
            <p>
              Para garantir a estabilidade da plataforma para todos os usuários, nossa API possui um limite de 120 requisições por minuto.
            </p>

            <p>
              A documentação completa e interativa (Swagger/OpenAPI) estará disponível em breve.
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default ApiPage;
