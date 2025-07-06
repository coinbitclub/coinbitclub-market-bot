import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AffiliateSaque() {
  const [available, setAvailable] = useState(0);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    api.get('/affiliate/stats')
      .then(res => setAvailable(res.data.availableWithdrawal))
      .catch(() => {});
  }, []);

  const submit = () => {
    api.post('/affiliate/withdraw', { amount: Number(amount) })
      .then(() => alert('Solicitação enviada!'))
      .catch(() => alert('Erro ao solicitar saque.'));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Solicitar Saque</h1>
      <div className="p-6 bg-[#101323] rounded-lg shadow space-y-4">
        <p><strong>Disponível para saque:</strong> R$ {available}</p>
        <label className="block">
          Valor (R$)
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full mt-1 p-2 bg-[#0a1123] border border-[#23263a] rounded"
            max={available}
          />
        </label>
        <button
          onClick={submit}
          className="px-4 py-2 bg-cyan-600 rounded hover:bg-cyan-500"
          disabled={!amount || Number(amount) > available}
        >
          Enviar Solicitação
        </button>
      </div>
    </div>
  );
}
