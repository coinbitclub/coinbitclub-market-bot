import React from "react";

export default function Plans() {
  return (
    <div className="p-8 text-white text-center">
      <h2 className="text-3xl font-bold mb-6">Escolha o seu plano</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-800 p-6 rounded">
          <h3 className="text-xl text-yellow-400 font-bold mb-2">Mensal</h3>
          <p className="text-lg font-semibold">R$ 120/mês</p>
        </div>
        <div className="bg-zinc-800 p-6 rounded border-2 border-yellow-500">
          <h3 className="text-xl text-yellow-300 font-bold mb-2">Pré-pago</h3>
          <p className="text-lg font-semibold">15% sobre lucro</p>
        </div>
        <div className="bg-zinc-800 p-6 rounded">
          <h3 className="text-xl text-yellow-400 font-bold mb-2">Internacional</h3>
          <p className="text-lg font-semibold">USD 50 + 5% sobre lucro</p>
        </div>
      </div>
    </div>
  );
}
