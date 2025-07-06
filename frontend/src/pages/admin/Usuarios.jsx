import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/admin/users').then(res => setUsers(res.data));
  }, []);

  return (
    <div>
      <h1 className='text-3xl font-bold mb-4'>Usuários</h1>
      <div className='overflow-auto bg-[#101323] rounded-lg'>
        <table className='min-w-full'>
          <thead>
            <tr className='text-left text-sm text-gray-400'>
              <th className='p-2'>ID</th>
              <th className='p-2'>Nome</th>
              <th className='p-2'>Email</th>
              <th className='p-2'>Plano</th>
              <th className='p-2'>Status</th>
              <th className='p-2'></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className='border-t border-[#23263a]'>
                <td className='p-2'>{u.id}</td>
                <td className='p-2'>{u.name}</td>
                <td className='p-2'>{u.email}</td>
                <td className='p-2'>{u.plan}</td>
                <td className='p-2'>{u.active ? 'Ativo' : 'Inativo'}</td>
                <td className='p-2'>
                  <button className='px-2 py-1 bg-cyan-600 rounded'>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
