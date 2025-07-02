import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function PlanManager() {
  const [plans, setPlans] = useState([
    { id: 1, nome: "Brasil Mensal", valor: 120, comissao: 8, ativo: true },
    { id: 2, nome: "Internacional", valor: 50, comissao: 5, ativo: true },
    { id: 3, nome: "Pré-Pago", valor: 0, comissao: 15, ativo: false }
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gerenciar Planos</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6 mb-4">
        <Button>Adicionar Novo Plano</Button>
      </div>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Nome</th>
              <th>Valor</th>
              <th>Comissão (%)</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id} className="border-b border-border">
                <td className="py-2">{p.nome}</td>
                <td>{p.valor ? `R$ ${p.valor}` : "—"}</td>
                <td>{p.comissao}%</td>
                <td>
                  {p.ativo ? (
                    <span className="text-green-400 font-semibold">Ativo</span>
                  ) : (
                    <span className="text-red-400 font-semibold">Inativo</span>
                  )}
                </td>
                <td>
                  <Button size="sm" variant="outline" className="mr-2">Editar</Button>
                  <Button size="sm" variant="destructive">Desativar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
