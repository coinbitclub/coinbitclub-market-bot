import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminFinance() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    api.get('/admin/finance').then(res => setRecords(res.data));
  }, []);

  const totalRevenue = records.reduce((sum, r) => sum + r.amount, 0);
  const totalCommissions = records.filter(r => r.type === 'commission').reduce((sum, r) => sum + r.amount, 0);
  const pendingWithdrawals = records.filter(r => r.type === 'withdrawal' && !r.resolved)
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className='space-y-6'>
      <h1 className='text-3xl font-bold'>Financeiro</h1>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
        <Card title="Receita total" value={`$${totalRevenue}`} />
        <Card title="Comissões pagas" value={`$${totalCommissions}`} />
        <Card title="Saques pendentes" value={`$${pendingWithdrawals}`} />
      </div>
      <div className='overflow-auto bg-[#101323] rounded-lg'>
        <table className='min-w-full'>
          <thead>
            <tr className='text-left text-sm text-gray-400'>
              <th className='p-2'>Data</th>
              <th className='p-2'>Tipo</th>
              <th className='p-2'>Valor</th>
              <th className='p-2'>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map(rec => (
              <tr key={rec.id} className='border-t border-[#23263a]'>
                <td className='p-2'>{new Date(rec.date).toLocaleDateString()}</td>
                <td className='p-2'>{rec.typeLabel}</td>
                <td className='p-2'>${rec.amount}</td>
                <td className='p-2'>{rec.resolved ? 'Concluído' : 'Pendente'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className='p-4 bg-[#101323] rounded-lg shadow'>
      <p className='text-sm'>{title}</p>
      <p className='text-2xl font-semibold mt-2'>{value}</p>
    </div>
  );
}
