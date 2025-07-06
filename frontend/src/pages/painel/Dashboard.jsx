import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/user/stats')
       .then(res => setStats(res.data))
       .catch(() => {});
  }, []);

  if (!stats) return <div>Carregando…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card title="Saldo pré-pago" value={`R$ ${stats.prepaidBalance}`} />
        <Card title="Saldo Bybit" value={`$ ${stats.bybitBalance}`} />
        <Card title="Saldo Binance" value={`$ ${stats.binanceBalance}`} />
        <Card title="Assertividade" value={`${stats.accuracy}%`} />
        <Card title="Retorno do dia" value={`${stats.dailyReturn}%`} />
        <Card title="Retorno histórico" value={`${stats.historicalReturn}%`} />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="p-4 bg-[#101323] rounded-lg shadow">
      <p className="text-sm">{title}</p>
      <p className="text-2xl font-semibold mt-2">{value}</p>
    </div>
  );
}
