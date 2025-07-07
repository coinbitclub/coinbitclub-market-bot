// src/components/SignalForm.jsx
import React, { useState } from 'react';
import { postSignal } from '../api';

export default function SignalForm() {
  const [symbol, setSymbol] = useState('');
  const [price,  setPrice]  = useState('');
  const [side,   setSide]   = useState('buy');
  const [msg,    setMsg]    = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const { ok, id } = await postSignal({ symbol, price: Number(price), side });
      setMsg(ok ? `Salvou sinal #${id}` : 'Erro desconhecido');
    } catch (err) {
      setMsg(`Erro: ${err.error || err.message}`);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="SYMBOL" />
      <input value={price}  onChange={e => setPrice(e.target.value)}    placeholder="PRICE" />
      <select value={side} onChange={e => setSide(e.target.value)}>
        <option value="buy">buy</option>
        <option value="sell">sell</option>
      </select>
      <button type="submit">Enviar Sinal</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
