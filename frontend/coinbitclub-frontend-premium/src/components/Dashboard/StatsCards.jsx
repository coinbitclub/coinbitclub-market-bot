import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCards({ saldo, acertos, erros, lucro }) {
  return (
    <div className="grid md:grid-cols-4 gap-4 mt-6">
      <Card className="p-4 flex flex-col items-center shadow-lg">
        <span className="text-muted-foreground text-sm">Saldo Atual</span>
        <span className="text-3xl font-extrabold text-cyan-400 mt-2">{saldo} USDT</span>
      </Card>
      <Card className="p-4 flex flex-col items-center shadow-lg">
        <span className="text-muted-foreground text-sm">Acertos</span>
        <span className="text-3xl font-extrabold text-green-500 mt-2">{acertos}%</span>
      </Card>
      <Card className="p-4 flex flex-col items-center shadow-lg">
        <span className="text-muted-foreground text-sm">Erros</span>
        <span className="text-3xl font-extrabold text-red-500 mt-2">{erros}%</span>
      </Card>
      <Card className="p-4 flex flex-col items-center shadow-lg">
        <span className="text-muted-foreground text-sm">Lucro Total</span>
        <span className="text-3xl font-extrabold text-cyan-400 mt-2 flex items-center">
          {lucro > 0 ? <TrendingUp className="text-green-500 mr-2" /> : <TrendingDown className="text-red-500 mr-2" />}
          {lucro}%
        </span>
      </Card>
    </div>
  );
}
