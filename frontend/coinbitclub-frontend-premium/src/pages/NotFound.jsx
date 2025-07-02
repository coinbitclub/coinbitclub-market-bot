import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <h1 className="text-6xl font-extrabold text-cyan-400 mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-6">Página não encontrada</p>
      <Button onClick={() => navigate("/")}>Voltar para o início</Button>
    </div>
  );
}
