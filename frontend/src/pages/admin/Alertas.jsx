import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminAlertsLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/admin/logs').then(res => setLogs(res.data));
  }, []);

  return (
    <div className='space-y-6'>
      <h1 className='text-3xl font-bold'>Alertas & Logs</h1>
      <div className='flex flex-wrap gap-4'>
        <select className='p-2 bg-[#101323] border border-[#23263a] rounded'>
          <option>Período</option>
        </select>
        <select className='p-2 bg-[#101323] border border-[#23263a] rounded'>
          <option>Origem</option>
        </select>
        <input
          type='text'
          placeholder='Buscar...'
          className='flex-1 p-2 bg-[#101323] border border-[#23263a] rounded'
        />
      </div>
      <div className='overflow-auto bg-[#101323] rounded-lg'>
        <table className='min-w-full'>
          <thead>
            <tr className='text-left text-sm text-gray-400'>
              <th className='p-2'>Data/Hora</th>
              <th className='p-2'>Tipo</th>
              <th className='p-2'>Origem</th>
              <th className='p-2'>Mensagem</th>
              <th className='p-2'>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className='border-t border-[#23263a]'>
                <td className='p-2'>{new Date(log.timestamp).toLocaleString()}</td>
                <td className='p-2'>
                  <span className={`px-2 py-1 rounded ${
                    log.level === 'ERRO' ? 'bg-red-600' :
                    log.level === 'AVISO' ? 'bg-yellow-600' :
                    'bg-blue-600'
                  } text-white text-xs`}>
                    {log.level}
                  </span>
                </td>
                <td className='p-2'>{log.source}</td>
                <td className='p-2'>{log.message}</td>
                <td className='p-2'>
                  <span className='px-2 py-1 bg-gray-500 text-white text-xs rounded'>
                    {log.resolved ? 'Resolvido' : 'Não Resolvido'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
