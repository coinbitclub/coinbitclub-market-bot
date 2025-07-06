import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AffiliateExtrato() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    api.get('/affiliate/statement')
      .then(res => setRecords(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Extrato de Comissão</h1>
      <div className="overflow-auto bg-[#101323] rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400">
              <th className="p-2">Data</th>
              <th className="p-2">Usuário Indicado</th>
              <th className="p-2">Status</th>
              <th className="p-2">Valor</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="border-t border-[#23263a]">
                <td className="p-2">{new Date(r.date).toLocaleDateString()}</td>
                <td className="p-2">{r.referredName}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">R$ {r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
