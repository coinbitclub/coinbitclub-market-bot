import React from 'react';
import Head from 'next/head';
import { FiCheckCircle, FiAlertTriangle, FiClock } from 'react-icons/fi';

const StatusPage = () => {
  const services = [
    { name: 'API Gateway', status: 'ok' },
    { name: 'Decision Engine', status: 'ok' },
    { name: 'Order Executor', status: 'ok' },
    { name: 'Signal Ingestor', status: 'maintenance' },
    { name: 'Website & Dashboard', status: 'ok' },
    { name: 'Database', status: 'error' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <FiCheckCircle className="text-emerald-500" />;
      case 'maintenance':
        return <FiClock className="text-yellow-500" />;
      case 'error':
        return <FiAlertTriangle className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Status da Plataforma - CoinbitClub</title>
      </Head>
      <main className="min-h-screen bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Status da Plataforma
            </h1>
            <p className="mt-4 text-lg text-slate-400">Acompanhe a disponibilidade dos nossos serviços em tempo real.</p>
          </div>

          <div className="rounded-lg bg-slate-800/50 p-8">
            <div className="space-y-6">
              {services.map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <span className="text-lg text-slate-300">{service.name}</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(service.status)}
                    <span className="font-semibold capitalize">{service.status === 'ok' ? 'Operacional' : service.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-8 text-center text-slate-500">
            Esta é uma página de exemplo. A integração com o status real do backend será implementada.
          </p>
        </div>
      </main>
    </>
  );
};

export default StatusPage;



