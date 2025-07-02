import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Planos() {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function fetchPlanos() {
      setLoading(true);
      setErro("");
      try {
        const res = await axios.get(`${API_BASE}/api/planos`);
        setPlanos(res.data.planos || []);
      } catch (err) {
        setErro("Erro ao carregar planos.");
      }
      setLoading(false);
    }
    fetchPlanos();
  }, []);

  return (
    <div className="flex min-h-screen bg-dark text-light">
      <Sidebar />
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6 text-accent">Planos CoinbitClub</h2>
        {erro && <div className="bg-red-600 text-white p-3 mb-4 rounded">{erro}</div>}
        {loading ? (
          <div className="text-center py-16 text-lg">Carregando...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {planos.map(plano => (
              <div key={plano.id} className="bg-light p-8 rounded-xl shadow text-dark">
                <div className="font-bold text-xl mb-2">{plano.nome}</div>
                <div className="text-2xl mb-2">{plano.valor}</div>
                <div className="mb-4">{plano.descricao}</div>
                <button className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-accent transition">Assinar</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
