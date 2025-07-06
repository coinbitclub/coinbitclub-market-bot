import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Plano() {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    api.get('/user/plan')
       .then(res => setPlan(res.data))
       .catch(() => {});
  }, []);

  if (!plan) return <div>Carregando…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Meu Plano</h1>
      <div className="p-6 bg-[#101323] rounded-lg shadow space-y-4">
        <p><strong>Plano atual:</strong> {plan.name}</p>
        <p><strong>Próxima cobrança:</strong> {new Date(plan.nextBilling).toLocaleDateString()}</p>
        <a
          href="/plans"
          className="inline-block px-4 py-2 bg-cyan-600 rounded hover:bg-cyan-500"
        >
          Alterar Plano
        </a>
      </div>
    </div>
  );
}
