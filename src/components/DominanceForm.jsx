// src/components/DominanceForm.jsx
import { useState } from 'react';
import { postDominance } from '../api';

export function DominanceForm() {
  const [btc, setBtc] = useState('');
  const [eth, setEth] = useState('');
  const [msg, setMsg] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const { ok, id } = await postDominance({ btc_dom: Number(btc), eth_dom: Number(eth) });
      setMsg(ok ? `Dominance #${id} salvo!` : 'Erro inesperado');
    } catch (err) {
      setMsg(`Erro: ${err.error || err.message}`);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <input value={btc} onChange={e => setBtc(e.target.value)} placeholder="BTC dominance" />
      <input value={eth} onChange={e => setEth(e.target.value)} placeholder="ETH dominance" />
      <button type="submit">Enviar Dominance</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
