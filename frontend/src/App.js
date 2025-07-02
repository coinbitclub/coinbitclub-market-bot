import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">CoinbitClub</h1>
      <nav className="space-x-4 mb-6">
        <Link to="/market" className="text-blue-600 hover:underline">Mercado</Link>
        <Link to="/checkout" className="text-blue-600 hover:underline">Checkout</Link>
      </nav>
      <p>Bem-vindo à plataforma de trading automatizado.</p>
    </div>
  );
}

function Market() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/fetch/market`)
      .then(res => res.json())
      .then(setData)
      .catch(err => setError(err.message));
  }, []);

  if (error) return <p className="p-6 text-red-500">Erro: {error}</p>;
  if (!data) return <p className="p-6">Carregando dados do mercado...</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Dados do Mercado</h2>
      <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

function Checkout() {
  const [planId, setPlanId] = useState('');
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = e => {
    e.preventDefault();
    setError(null);
    fetch(`${API_BASE}/api/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId, user_email: email })
    })
      .then(res => res.json())
      .then(json => {
        if (json.url) {
          window.location.href = json.url;
        } else {
          setError(json.error || 'Erro no checkout');
        }
      })
      .catch(err => setError(err.message));
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Iniciar Checkout</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">ID do Plano</label>
          <input
            type="text"
            value={planId}
            onChange={e => setPlanId(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">E-mail do Cliente</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Pagar Agora
        </button>
      </form>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/market" element={<Market />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
