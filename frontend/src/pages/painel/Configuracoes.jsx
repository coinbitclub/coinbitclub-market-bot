import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Configuracoes() {
  const [keys, setKeys] = useState({ bybitKey: '', bybitSecret: '', binanceKey: '', binanceSecret: '' });

  useEffect(() => {
    api.get('/user/api-keys').then(res => setKeys(res.data));
  }, []);

  const handleChange = e => {
    setKeys({ ...keys, [e.target.name]: e.target.value });
  };

  const save = () => {
    api.put('/user/api-keys', keys);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurações de API</h1>
      <form className="p-6 bg-[#101323] rounded-lg shadow space-y-4">
        <label>
          API Key Bybit
          <input
            name="bybitKey"
            value={keys.bybitKey}
            onChange={handleChange}
            className="w-full mt-1 p-2 bg-[#0a1123] border border-[#23263a] rounded"
          />
        </label>
        <label>
          Secret Key Bybit
          <input
            name="bybitSecret"
            type="password"
            value={keys.bybitSecret}
            onChange={handleChange}
            className="w-full mt-1 p-2 bg-[#0a1123] border border-[#23263a] rounded"
          />
        </label>
        <label>
          API Key Binance
          <input
            name="binanceKey"
            value={keys.binanceKey}
            onChange={handleChange}
            className="w-full mt-1 p-2 bg-[#0a1123] border border-[#23263a] rounded"
          />
        </label>
        <label>
          Secret Key Binance
          <input
            name="binanceSecret"
            type="password"
            value={keys.binanceSecret}
            onChange={handleChange}
            className="w-full mt-1 p-2 bg-[#0a1123] border border-[#23263a] rounded"
          />
        </label>
        <button
          type="button"
          onClick={save}
          className="px-4 py-2 bg-cyan-600 rounded hover:bg-cyan-500"
        >
          Salvar
        </button>
      </form>
    </div>
  );
}
