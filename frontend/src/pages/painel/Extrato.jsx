import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Extrato() {
  const [ops, setOps] = useState([]);

  useEffect(() => {
    api.get('/user/operations').then(res => setOps(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Extrato de Operações</h1>
      <div className="overflow-auto bg-[#101323] rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400">
              <th className="p-2">Data</th>
              <th className="p-2">Par</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Valor</th>
              <th className="p-2">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {ops.map(o => (
              <tr key={o.id} className="border-t border-[#23263a]">
                <td className="p-2">{new Date(o.date).toLocaleString()}</td>
                <td className="p-2">{o.pair}</td>
                <td className="p-2">{o.type}</td>
                <td className="p-2">R$ {o.amount}</td>
                <td className={`p-2 ${o.profit>=0 ? 'text-green-400' : 'text-red-400'}`}>
                  {o.profit>=0 ? '+' : '-'} {Math.abs(o.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
