import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import { FiBarChart2 } from 'react-icons/fi';

export default function AdminAIReports() {
  return (
    <AdminLayout title="Relatórios IA">
      <div className="rounded-xl border border-blue-500 bg-black p-6 shadow-lg hover:shadow-blue-400/20 transition-all mb-8">
        <div className="flex items-center gap-2 text-blue-400 mb-2">
          <FiBarChart2 className="text-2xl" />
          <span className="font-bold text-lg">Relatórios Inteligentes</span>
        </div>
        <div className="text-gray-300 text-sm">Acompanhe relatórios de performance, alertas e insights gerados por IA.</div>
      </div>
      <div className="rounded-xl border border-pink-500 bg-black p-6 shadow-lg hover:shadow-pink-400/20 transition-all">
        <div className="mb-4 text-pink-400 font-bold text-lg">Tabela de Relatórios IA (mock)</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="bg-gradient-to-r from-pink-500 to-blue-500 text-white">
              <tr>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Insight</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700 hover:bg-gray-900">
                <td className="px-4 py-2">21/07/2025</td>
                <td className="px-4 py-2">Performance</td>
                <td className="px-4 py-2">Bot superou o mercado</td>
                <td className="px-4 py-2 text-green-400">Validado</td>
                <td className="px-4 py-2"><button className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600">Ver</button></td>
              </tr>
              <tr className="hover:bg-gray-900">
                <td className="px-4 py-2">20/07/2025</td>
                <td className="px-4 py-2">Alerta</td>
                <td className="px-4 py-2">Oscilação atípica detectada</td>
                <td className="px-4 py-2 text-yellow-400">Pendente</td>
                <td className="px-4 py-2"><button className="rounded bg-pink-500 px-3 py-1 text-white hover:bg-pink-600">Ver</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
