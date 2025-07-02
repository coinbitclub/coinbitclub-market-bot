import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    nome: "Plano Brasil",
    preco: "R$ 120/mês + 8% sobre o lucro",
    detalhes: [
      "Acesso completo ao robô",
      "8% de comissão apenas sobre lucro",
      "Testnet gratuita por 7 dias",
      "Suporte nacional",
      "Controle de saldo pré-pago"
    ],
    destaque: true
  },
  {
    nome: "Plano Brasil Pré-Pago",
    preco: "15% sobre o lucro",
    detalhes: [
      "Sem mensalidade fixa",
      "15% de comissão apenas sobre lucro",
      "Testnet gratuita por 7 dias",
      "Suporte nacional",
      "Controle de saldo pré-pago"
    ]
  },
  {
    nome: "Plano Internacional",
    preco: "USD 50/mês + 5% sobre o lucro",
    detalhes: [
      "Acesso completo ao robô",
      "5% de comissão apenas sobre lucro",
      "Testnet gratuita por 7 dias",
      "Suporte global",
      "Controle de saldo pré-pago em USD"
    ]
  },
  {
    nome: "Internacional Pré-Pago",
    preco: "15% sobre o lucro (USD)",
    detalhes: [
      "Sem mensalidade fixa",
      "15% de comissão apenas sobre lucro",
      "Testnet gratuita por 7 dias",
      "Suporte global",
      "Controle de s
