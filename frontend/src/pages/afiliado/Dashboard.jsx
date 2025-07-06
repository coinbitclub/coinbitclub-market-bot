import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AffiliateDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/affiliate/stats')
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  if (!stats) return <div>Carregando…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard de Afiliado</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Total de Indicações" value={stats.totalReferrals} />
        <Card title="Comissão Pendente" value={`R$ ${stats.pendingCommission}`} />
        <Card title="Comissão Paga" value={`R$ ${stats.paidCommission}`} />
        <Card title="Saque Disponível" value={`R$ ${stats.availableWithdrawal}`} />
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
