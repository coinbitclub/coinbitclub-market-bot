import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const API_BASE = process.env.REACT_APP_API_URL || "";

export default function ApiKeys() {
  const [keys, setKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [bybitKey, setBybitKey] = useState("");
  const [binanceKey, setBinanceKey] = useState("");

  useEffect(() => {
    async function fetchKeys() {
      setLoading(true);
      setErro("");
      try {
        const token = localStorage.getItem("user_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE}/api/user/api-keys`, { headers });
        setKeys(res.data.keys || {});
      } catch (err) {
        setErro("Erro ao carregar suas API Keys.");
      }
      setLoading(false);
    }
    fetchKeys();
  }, []);

  // Exemplo de salvar nova chave
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("user_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API_BASE}/api/user/api-keys`, {
        bybitKey, binanceKey
      }, { headers });
      alert("Chaves salvas com sucesso!");
    } catch (err) {
      alert("Erro ao salvar chaves.");
    }
  };

  return (
    <div className="flex min-h-screen bg-dark text-light">
      <Sidebar />
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6 text-accent">Minhas API Keys</h2>
        {erro && <div className="bg-red-600 text-white p-3 mb-4 rounded">{erro}</div>}
        {loading ? (
          <div className="text-center py-16 text-lg">Carregando...</div>
        ) : (
          <form className="bg-light p-8 rounded-xl shadow text-dark max-w-xl" onSubmit={handleSave}>
            <div className="mb-4">
              <label className="block font-bold mb-1">Bybit API Key</label>
              <input
                className="w-full border p-3 rounded"
                value={bybitKey}
                onChange={e => setBybitKey(e.target.value)}
                placeholder={keys.bybit || ""}
              />
            </div>
            <div className="mb-4">
              <label className="block font-bold mb-1">Binance API Key</label>
              <input
                className="w-full border p-3 rounded"
                value={binanceKey}
                onChange={e => setBinanceKey(e.target.value)}
                placeholder={keys.binance || ""}
              />
            </div>
            <button className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-accent transition">Salvar</button>
          </form>
        )}
      </main>
    </div>
  );
}
