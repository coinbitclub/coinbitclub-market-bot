import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminParams() {
  const [params, setParams] = useState({
    brMonthly: 0, brCommission: 0,
    usMonthly: 0, usCommission: 0
  });

  useEffect(() => {
    api.get('/admin/parameters').then(res => setParams(res.data));
  }, []);

  const handleChange = e => {
    setParams({ ...params, [e.target.name]: Number(e.target.value) });
  };

  const save = () => {
    api.put('/admin/parameters', params);
  };

  return (
    <div className='space-y-6'>
      <h1 className='text-3xl font-bold'>Parâmetros do Sistema</h1>
      <form className='grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-[#101323] rounded-lg'>
        <div>
          <label className='block'>Mensalidade Brasil (R$)</label>
          <input
            type='number'
            name='brMonthly'
            value={params.brMonthly}
            onChange={handleChange}
            className='w-full mt-1 p-2 border border-[#23263a] rounded bg-[#0a1123]'
          />
        </div>
        <div>
          <label className='block'>Comissão Brasil (%)</label>
          <input
            type='number'
            name='brCommission'
            value={params.brCommission}
            onChange={handleChange}
            className='w-full mt-1 p-2 border border-[#23263a] rounded bg-[#0a1123]'
          />
        </div>
        <div>
          <label className='block'>Mensalidade Exterior (USD)</label>
          <input
            type='number'
            name='usMonthly'
            value={params.usMonthly}
            onChange={handleChange}
            className='w-full mt-1 p-2 border border-[#23263a] rounded bg-[#0a1123]'
          />
        </div>
        <div>
          <label className='block'>Comissão Exterior (%)</label>
          <input
            type='number'
            name='usCommission'
            value={params.usCommission}
            onChange={handleChange}
            className='w-full mt-1 p-2 border border-[#23263a] rounded bg-[#0a1123]'
          />
        </div>
        <button
          type='button'
          onClick={save}
          className='col-span-full px-4 py-2 bg-cyan-600 rounded-lg'
        >
          Salvar Parâmetros
        </button>
      </form>
    </div>
  );
}
