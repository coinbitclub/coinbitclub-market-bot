import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Riscos() {
  const [defaults, setDefaults] = useState({});
  const [custom, setCustom] = useState({ leverage: '', capitalPct: '', stopPct: '' });

  useEffect(() => {
    api.get('/user/risks').then(res => {
      setDefaults(res.data.defaults);
      setCustom(res.data.custom || {});
    });
  }, []);

  const handleChange = e => {
    setCustom({ ...custom, [e.target.name]: e.target.value });
  };

  const save = () => {
    api.put('/user/risks', custom);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Parâmetros de Risco</h1>

      <div className="p-4 bg-[#101323] rounded-lg shadow space-y-4">
        <div>
          <h2 className="font-semibold">Padrão do Sistema</h2>
          <p>Alavancagem: {defaults.leverage}x</p>
          <p>Capital por ordem: {defaults.capitalPct}%</p>
          <p>Stop loss máximo: {defaults.stopPct}%</p>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold text-cyan-400">Meus Parâmetros</h2>
          <label>
            Alavancagem
            <input
              name="leverage"
              value={custom.leverage}
              onChange={handleChange}
              className="w-full mt-1 p-2 bg-[#0a1123] border border-[#23263a] rounded"
            />
          </label>
          <label>
            Capital por ordem (%)
            <input
              name="capitalPct"
              value={custom.capitalPct}
              onChange={handleChange}
              className="w-full mt-1 p-2 bg-[#0a1123] border border-[#23263a] rounded"
            />
          </label>
          <label>
            Stop loss máximo (%)
            <input
              name="stopPct"
              value={custom.stopPct}
              onChange={handleChange}
              className="w-full mt-1 p-2 bg-[#0a1123] border border-[#23263a] rounded"
            />
          </label>
          <button
            onClick={save}
            className="mt-2 px-4 py-2 bg-cyan-600 rounded hover:bg-cyan-500"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
