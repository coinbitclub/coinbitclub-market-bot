import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState([]);

  useEffect(() => {
    api.get('/admin/affiliates').then(res => setAffiliates(res.data));
  }, []);

  return (
    <div>
      <h1 className='text-3xl font-bold mb-4'>Afiliados</h1>
      <div className='overflow-auto bg-[#101323] rounded-lg'>
        <table className='min-w-full'>
          <thead>
            <tr className='text-left text-sm text-gray-400'>
              <th className='p-2'>ID</th>
              <th className='p-2'>Nome</th>
              <th className='p-2'>Comissão</th>
              <th className='p-2'>Status</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.map(a => (
              <tr key={a.id} className='border-t border-[#23263a]'>
                <td className='p-2'>{a.id}</td>
                <td className='p-2'>{a.name}</td>
                <td className='p-2'>${a.commission}</td>
                <td className='p-2'>{a.paid ? 'Pago' : 'Pendente'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
