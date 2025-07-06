import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Sinais() {
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    api.get('/user/signals').then(res => setSignals(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Sinais Recebidos</h1>
      <div className="overflow-auto bg-[#101323] rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400">
              <th className="p-2">Data/Hora</th>
              <th className="p-2">Ativo</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Direção</th>
            </tr>
          </thead>
          <tbody>
            {signals.map(s => (
              <tr key={s.id} className="border-t border-[#23263a]">
                <td className="p-2">{new Date(s.time).toLocaleString()}</td>
                <td className="p-2">{s.pair}</td>
                <td className="p-2">{s.type}</td>
                <td className={`p-2 ${s.direction==='LONG' ? 'text-green-400' : 'text-red-400'}`}>
                  {s.direction}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
