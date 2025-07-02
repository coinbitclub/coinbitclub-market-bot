import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Alerts() {
  const [alerts, setAlerts] = useState([
    { id: 1, tipo: "Saldo mínimo", ativo: true },
    { id: 2, tipo: "Drawdown diário", ativo: false },
    { id: 3, tipo: "Preço do ativo", ativo: true },
  ]);

  function toggleAlert(id) {
    setAlerts(alerts =>
      alerts.map(a =>
        a.id === id ? { ...a, ativo: !a.ativo } : a
      )
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Alertas Personalizados</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Tipo de Alerta</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map(a => (
              <tr key={a.id} className="border-b border-border">
                <td className="py-2">{a.tipo}</td>
                <td>
                  {a.ativo ? (
                    <span className="text-green-400 font-semibold">Ativo</span>
                  ) : (
                    <span className="text-red-400 font-semibold">Inativo</span>
                  )}
                </td>
                <td>
                  <Button size="sm" onClick={() => toggleAlert(a.id)}>
                    {a.ativo ? "Desativar" : "Ativar"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button className="mt-6">Adicionar Alerta</Button>
      </div>
    </div>
  );
}
