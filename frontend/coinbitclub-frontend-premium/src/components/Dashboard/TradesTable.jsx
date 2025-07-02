import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function TradesTable({ data }) {
  return (
    <div className="bg-card shadow-xl rounded-2xl overflow-hidden border border-border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Data</TableCell>
            <TableCell>Par</TableCell>
            <TableCell>Direção</TableCell>
            <TableCell>Resultado</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell>{trade.executed_at}</TableCell>
              <TableCell>{trade.ticker}</TableCell>
              <TableCell>
                <Badge
                  className={trade.side === "LONG" ? "bg-green-600" : trade.side === "SHORT" ? "bg-red-600" : "bg-gray-600"}
                >
                  {trade.side}
                </Badge>
              </TableCell>
              <TableCell>
                <span className={trade.profit >= 0 ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                  {trade.profit}%
                </span>
              </TableCell>
              <TableCell>
                <Badge className={trade.status === "fechada" ? "bg-blue-500" : "bg-yellow-400"}>
                  {trade.status}
                </Badge>
              </TableCell>
              <TableCell>
                <button className="text-cyan-500 hover:underline">Detalhes</button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
