import React, { useEffect, useState } from "react";
import axios from "axios";
const API_URL = "https://market-bot-production-8c91.up.railway.app/api/user";
const getToken = () => localStorage.getItem("user_token");

export default function UserDashboard() {
  const [user, setUser] = useState({});
  const [plan, setPlan] = useState({});
  const [balance, setBalance] = useState({});
  const [finance, setFinance] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchPlans();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [userRes, balRes, planRes, finRes] = await Promise.all([
      axios.get(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      axios.get(`${API_URL}/balance`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      axios.get(`${API_URL}/plan`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      axios.get(`${API_URL}/financial`, { headers: { Authorization: `Bearer ${getToken()}` } }),
    ]);
    setUser(userRes.data);
    setBalance(balRes.data);
    setPlan(planRes.data);
    setFinance(finRes.data);
    setLoading(false);
  }

  async function fetchPlans() {
    const res = await axios.get(`${API_URL}/plans`);
    setPlans(res.data);
  }

  async function subscribe(planId) {
    const res = await axios.post(`${API_URL}/subscribe`, { planId }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    window.location.href = res.data.checkout_url;
  }

  return (
    <div>
      <h2>Bem-vindo, {user.nome}</h2>
      <p>Plano atual: {plan.plano_nome || "Nenhum"}</p>
      <p>Saldo disponível: R$ {balance.saldo?.toFixed(2)}</p>

      <h3>Financeiro</h3>
      <table border="1">
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>
          {finance.map(f => (
            <tr key={f.id}>
              <td>{new Date(f.data).toLocaleDateString()}</td>
              <td>{f.tipo_movimento}</td>
              <td>R$ {f.valor?.toFixed(2)}</td>
              <td>{f.descricao}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Planos disponíveis</h3>
      <ul>
        {plans.map(p => (
          <li key={p.id}>
            {p.nome} - R$ {p.valor_mensalidade?.toFixed(2)} 
            <button onClick={() => subscribe(p.id)}>Assinar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
