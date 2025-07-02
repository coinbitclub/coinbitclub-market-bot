import React, { useEffect, useState } from "react";
import axios from "axios";
import SidebarAdmin from "../../components/SidebarAdmin";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function AdminAfiliados() {
  const [afiliados, setAfiliados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function fetchAfiliados() {
      setLoading(true);
      setErro("");
      try {
        const token = localStorage.getItem("admin_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE}/api/admin/afiliados`, { headers });
        setAfiliados(res.data.afiliados || []);
      } catch (err) {
        setErro("Erro ao carregar afiliados.");
      }
      setLoading(false);
    }
    fetchAfiliados();
  }, []);

  // Exemplo de baixa manual de comissão
  const baixarComissao = async (afiliadoId, comissaoId) => {
    try {
      const token = localStorage.getItem("admin_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API_BASE}/api/admin/afiliados/baixa`, {
        afiliadoId, comissaoId
      }, { headers });
      alert("Comissão baixada com sucesso!");
    } catch (err) {
      alert("Erro ao dar baixa na comissão.");
    }
  };

  return (
    <div className="flex min-h-screen bg-dark text-light">
      <SidebarAdmin />
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6 text-accent">Gestão de Afiliados</h2>
        {erro && <div className="bg-red-600 text-white p-3 mb-4 rounded">{erro}</div>}
        {loading ? (
          <div className="text-center py-16 text-lg">Carregando...</div>
        ) : (
          <div className="bg-light rounded-xl shadow p-6 text-dark">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">ID</th>
                  <th className="py-2">Nome</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Comissão Pendente</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {afiliados.length === 0 ? (
                  <tr><td colSpan={5}>Nenhum afiliado encontrado.</td></tr>
                ) : afiliados.map(af => (
                  <tr key={af.id}>
                    <td>{af.id}</td>
                    <td>{af.nome}</td>
                    <td>{af.email}</td>
                    <td>{af.comissaoPendente}</td>
                    <td>
                      <button
                        className="text-primary underline"
                        onClick={() => baixarComissao(af.id, af.comissaoId)}
                      >Dar baixa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
