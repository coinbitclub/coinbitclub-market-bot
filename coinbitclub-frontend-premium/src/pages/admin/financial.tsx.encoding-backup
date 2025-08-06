import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import { FiBarChart2 } from 'react-icons/fi';

export default function AdminFinancial() {
  return (
    <AdminLayout title="Financeiro">
      <div className="rounded-xl border border-blue-500 bg-black p-6 shadow-lg hover:shadow-blue-400/20 transition-all mb-8">
        <div className="flex items-center gap-2 text-blue-400 mb-2">
          <FiBarChart2 className="text-2xl" />
          <span className="font-bold text-lg">Resumo Financeiro</span>
        </div>
        <div className="text-gray-300 text-sm">Acompanhe receitas, despesas, saldo e movimentações financeiras do sistema.</div>
      </div>
      <div className="rounded-xl border border-amber-500 bg-black p-6 shadow-lg hover:shadow-amber-400/20 transition-all">
        <div className="mb-4 text-amber-400 font-bold text-lg">Tabela Financeira (mock)</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="bg-gradient-to-r from-blue-500 to-amber-400 text-white">
              <tr>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Descrição</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Valor</th>
                <th className="px-4 py-2">Saldo</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700 hover:bg-gray-900">
                <td className="px-4 py-2">21/07/2025</td>
                <td className="px-4 py-2">Receita de vendas</td>
                <td className="px-4 py-2 text-green-400">Entrada</td>
                <td className="px-4 py-2 text-green-400">R$ 2.000</td>
                <td className="px-4 py-2">R$ 10.000</td>
              </tr>
              <tr className="hover:bg-gray-900">
                <td className="px-4 py-2">20/07/2025</td>
                <td className="px-4 py-2">Pagamento afiliado</td>
                <td className="px-4 py-2 text-red-400">Saída</td>
                <td className="px-4 py-2 text-red-400">R$ 500</td>
                <td className="px-4 py-2">R$ 8.000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
