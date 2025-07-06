import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminOperations() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get('/admin/operations').then(res => setData(res.data));
  }, []);

  return (
    <div className='space-y-6'>
      <h1 className='text-3xl font-bold'>Operações</h1>
      <div className='flex flex-wrap gap-4'>
        <select className='p-2 bg-[#101323] border border-[#23263a] rounded'>
          <option>Produção</option>
          <option>Staging</option>
        </select>
        <select className='p-2 bg-[#101323] border border-[#23263a] rounded'>
          <option>Bybit</option>
          <option>Binance</option>
        </select>
        <div className='flex items-center gap-2'>
          <input type='date' className='p-2 bg-[#101323] border border-[#23263a] rounded' />
          <span>→</span>
          <input type='date' className='p-2 bg-[#101323] border border-[#23263a] rounded' />
        </div>
      </div>
      <div className='p-4 bg-[#101323] rounded-lg'>
        Assertividade: {calculateAccuracy(data)}%
      </div>
      <div className='overflow-auto bg-[#101323] rounded-lg'>
        <table className='min-w-full'>
          <thead>
            <tr className='text-left text-sm text-gray-400'>
              <th className='p-2'>ID</th>
              <th className='p-2'>Usuário</th>
              <th className='p-2'>Ativo</th>
              <th className='p-2'>Tipo</th>
              <th className='p-2'>Valor</th>
              <th className='p-2'>Resultado</th>
              <th className='p-2'>Abertura</th>
            </tr>
          </thead>
          <tbody>
            {data.map(op => (
              <tr key={op.id} className='border-t border-[#23263a]'>
                <td className='p-2'>{op.id}</td>
                <td className='p-2'>{op.userName}</td>
                <td className='p-2'>{op.pair}</td>
                <td className='p-2'>{op.type}</td>
                <td className='p-2'>${op.amount}</td>
                <td className={`p-2 ${op.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {op.profit >= 0 ? '●' : '●'} ${Math.abs(op.profit)}
                </td>
                <td className='p-2'>{new Date(op.openedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function calculateAccuracy(list) {
  if (!list.length) return 0;
  const wins = list.filter(i => i.profit >= 0).length;
  return Math.round((wins / list.length) * 100);
}
