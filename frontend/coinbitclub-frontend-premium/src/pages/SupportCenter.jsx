import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function SupportCenter() {
  const [tickets, setTickets] = useState([
    { id: 1, assunto: "Problema na integração da API", status: "Aberto", data: "2024-07-01" },
    { id: 2, assunto: "Dúvida sobre comissão", status: "Respondido", data: "2024-06-30" }
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Central de Suporte</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6 mb-8">
        <Button>Novo Chamado</Button>
      </div>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <h2 className="font-bold text-lg mb-3">Meus Chamados</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Assunto</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.id} className="border-b border-border">
                <td className="py-2">{t.assunto}</td>
                <td>
                  <span className={t.status === "Aberto" ? "text-yellow-400" : "text-green-400"}>
                    {t.status}
                  </span>
                </td>
                <td>{t.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
