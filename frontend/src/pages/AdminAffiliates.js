import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://market-bot-production-8c91.up.railway.app/api/admin";
const getToken = () => localStorage.getItem("admin_token");

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    cpf: "",
    pix: "",
    banco: "",
    agencia: "",
    conta: "",
    tipo: ""
  });
  const [extrato, setExtrato] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carrega lista
  useEffect(() => {
    fetchAffiliates();
  }, []);

  async function fetchAffiliates() {
    setLoading(true);
    const res = await axios.get(`${API_URL}/affiliates`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setAffiliates(res.data);
    setLoading(false);
  }

  async function handleSelect(af) {
    setSelected(af);
    setForm(af);
    const res = await axios.get(`${API_URL}/affiliates/${af.id}/extrato`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setExtrato(res.data);
  }

  async function handleSave() {
    if (selected) {
      await axios.put(`${API_URL}/affiliates/${selected.id}`, form, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } else {
      await axios.post(`${API_URL}/affiliates`, form, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    }
    fetchAffiliates();
    setSelected(null);
    setForm({
      nome: "",
      sobrenome: "",
      email: "",
      cpf: "",
      pix: "",
      banco: "",
      agencia: "",
      conta: "",
      tipo: ""
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("Excluir afiliado?")) return;
    await axios.delete(`${API_URL}/affiliates/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    fetchAffiliates();
  }

  async function handleBaixa(valor, obs) {
    await axios.post(`${API_URL}/affiliates/${selected.id}/baixa`, { valor, obs }, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    handleSelect(selected);
  }

  return (
    <div>
      <h2>Afiliados</h2>
      <button onClick={() => setSelected(null)}>Novo afiliado</button>
      <table border="1">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>CPF</th>
            <th>Saldo</th>
            <th>Pix</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {affiliates.map(a => (
            <tr key={a.id}>
              <td>{a.nome} {a.sobrenome}</td>
              <td>{a.email}</td>
              <td>{a.cpf}</td>
              <td>R$ {a.comissao_pendente?.toFixed(2) || "0,00"}</td>
              <td>{a.pix}</td>
              <td>
                <button onClick={() => handleSelect(a)}>Editar</button>
                <button onClick={() => handleDelete(a.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(selected || !selected) && (
        <div>
          <h3>{selected ? "Editar Afiliado" : "Novo Afiliado"}</h3>
          <input placeholder="Nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          <input placeholder="Sobrenome" value={form.sobrenome} onChange={e => setForm(f => ({ ...f, sobrenome: e.target.value }))} />
          <input placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <input placeholder="CPF" value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} />
          <input placeholder="Pix" value={form.pix} onChange={e => setForm(f => ({ ...f, pix: e.target.value }))} />
          <input placeholder="Banco" value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))} />
          <input placeholder="Agência" value={form.agencia} onChange={e => setForm(f => ({ ...f, agencia: e.target.value }))} />
          <input placeholder="Conta" value={form.conta} onChange={e => setForm(f => ({ ...f, conta: e.target.value }))} />
          <input placeholder="Tipo de conta" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} />
          <button onClick={handleSave}>Salvar</button>
        </div>
      )}

      {selected && (
        <div>
          <h4>Extrato de Comissões</h4>
          <table border="1">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {extrato.map(x => (
                <tr key={x.id}>
                  <td>{new Date(x.data).toLocaleDateString()}</td>
                  <td>{x.descricao}</td>
                  <td>R$ {x.valor?.toFixed(2)}</td>
                  <td>{x.tipo}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => {
            const valor = window.prompt("Valor da baixa:");
            const obs = window.prompt("Observação:");
            handleBaixa(valor, obs);
          }}>Registrar Baixa/Pagamento</button>
        </div>
      )}
    </div>
  );
}
