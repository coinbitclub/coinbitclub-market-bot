import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import { FiDollarSign } from 'react-icons/fi';

export default function AdminFinancialSettlements() {
  return (
    <AdminLayout title="Acertos Financeiros">
      <div className="rounded-xl border border-amber-500 bg-black p-6 shadow-lg hover:shadow-amber-400/20 transition-all mb-8">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <FiDollarSign className="text-2xl" />
          <span className="font-bold text-lg">Pagamentos & Reembolsos</span>
        </div>
        <div className="text-gray-300 text-sm">Gerencie acertos financeiros, reembolsos e pagamentos automáticos.</div>
      </div>
      <div className="rounded-xl border border-blue-500 bg-black p-6 shadow-lg hover:shadow-blue-400/20 transition-all">
        <div className="mb-4 text-blue-400 font-bold text-lg">Tabela de Acertos Financeiros (mock)</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="bg-gradient-to-r from-amber-400 to-pink-500 text-white">
              <tr>
                <th className="px-4 py-2">Usuário</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Valor</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {/* TODO: Replace with real settlement data from backend API */}
              <tr className="border-b border-gray-700 hover:bg-gray-900">
                <td className="px-4 py-2 text-gray-500">-</td>
                <td className="px-4 py-2 text-gray-500">-</td>
                <td className="px-4 py-2 text-gray-500">-</td>
                <td className="px-4 py-2 text-gray-500">-</td>
                <td className="px-4 py-2 text-gray-500">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}



