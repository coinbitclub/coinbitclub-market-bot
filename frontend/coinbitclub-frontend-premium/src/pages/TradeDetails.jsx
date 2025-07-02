import { useParams } from "react-router-dom";

export default function TradeDetails() {
  // Pegando o ID da operação da URL
  const { id } = useParams();

  // Mock de operação (troque para fetch real por id)
  const trade = {
    id,
    par: "BTC/USDT",
    tipo: "LONG",
    entrada: 65000,
    saida: 66780,
    dataAbertura: "2024-06-19",
    dataFechamento: "2024-06-20",
    resultado: 2.74,
    status: "fechada"
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Detalhe da Operação</h1>
      <div className="bg-card rounded-xl shadow border border-border p-8 max-w-xl">
        <div className="mb-2"><b>Par:</b> {trade.par}</div>
        <div className="mb-2"><b>Tipo:</b> {trade.tipo}</div>
        <div className="mb-2"><b>Preço de Entrada:</b> {trade.entrada}</div>
        <div className="mb-2"><b>Preço de Saída:</b> {trade.saida}</div>
        <div className="mb-2"><b>Resultado:</b> <span className={trade.resultado > 0 ? "text-green-400" : "text-red-400"}>{trade.resultado}%</span></div>
        <div className="mb-2"><b>Status:</b> {trade.status}</div>
        <div className="mb-2"><b>Abertura:</b> {trade.dataAbertura}</div>
        <div className="mb-2"><b>Fechamento:</b> {trade.dataFechamento}</div>
      </div>
    </div>
  );
}
