import React from 'react';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Planos e Assinaturas</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-zinc-900 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Básico</h3>
          <p className="text-3xl font-bold text-blue-400 mb-4">$97/mês</p>
          <ul className="space-y-2 mb-6">
            <li>• Até 5 operações simultâneas</li>
            <li>• Suporte básico</li>
            <li>• Relatórios mensais</li>
          </ul>
          <button className="w-full bg-blue-500 hover:bg-blue-600 py-2 px-4 rounded">
            Assinar Básico
          </button>
        </div>
        <div className="bg-zinc-900 p-6 rounded-lg border border-blue-500">
          <div className="text-center mb-4">
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
              Recomendado
            </span>
          </div>
          <h3 className="text-xl font-bold mb-4">Premium</h3>
          <p className="text-3xl font-bold text-blue-400 mb-4">$197/mês</p>
          <ul className="space-y-2 mb-6">
            <li>• Operações ilimitadas</li>
            <li>• Suporte prioritário</li>
            <li>• Relatórios em tempo real</li>
            <li>• API avançada</li>
          </ul>
          <button className="w-full bg-blue-500 hover:bg-blue-600 py-2 px-4 rounded">
            Assinar Premium
          </button>
        </div>
      </div>
    </div>
  );
}
