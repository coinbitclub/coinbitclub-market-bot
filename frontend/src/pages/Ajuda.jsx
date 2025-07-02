import React from "react";
import Sidebar from "../components/Sidebar";

export default function Ajuda() {
  return (
    <div className="flex min-h-screen bg-dark text-light">
      <Sidebar />
      <main className="flex-1 p-8 max-w-2xl">
        <h2 className="text-3xl font-bold mb-6 text-accent">Central de Ajuda</h2>
        <div className="bg-light rounded-xl shadow p-6 text-dark">
          <h3 className="font-bold mb-4">Dúvidas Frequentes</h3>
          <ul className="list-disc list-inside space-y-3">
            <li><b>Preciso transferir dinheiro para CoinbitClub?</b> Não. O saldo sempre fica na sua exchange.</li>
            <li><b>Posso operar em conta demo?</b> Sim! Use Binance Testnet ou Bybit Testnet para simular operações sem risco.</li>
            <li><b>Consigo pausar/desligar o robô?</b> Sim. Você tem total controle para pausar, desligar ou alterar parâmetros a qualquer momento.</li>
            <li><b>Como funciona a cobrança da comissão?</b> Só paga comissão sobre lucro, e nunca no prejuízo.</li>
            <li><b>Quais os riscos?</b> Mercado de cripto é volátil. A CoinbitClub não garante lucros e não tem acesso ao seu saldo.</li>
            <li><b>Como acessar o suporte?</b> Utilize o botão WhatsApp no rodapé ou envie email para faleconosco@coinbitclub.vip</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
