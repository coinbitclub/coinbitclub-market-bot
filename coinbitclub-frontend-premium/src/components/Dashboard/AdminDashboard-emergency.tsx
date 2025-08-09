import React from 'react';
import { FiUsers, FiDollarSign, FiActivity, FiBarChart } from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  user_type: string;
}

interface AdminDashboardProps {
  user: User;
}

const AdminDashboardEmergency: React.FC<AdminDashboardProps> = ({ user }) => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Simples */}
      <div className="bg-blue-600 text-white p-6 rounded-lg mb-6">
        <h1 className="text-2xl font-bold">Dashboard Admin - {user.name}</h1>
        <p className="text-blue-200">Sistema CoinBitClub Online</p>
      </div>

      {/* Cards de Métricas Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Total Usuários</p>
              <p className="text-2xl font-bold">1,247</p>
            </div>
            <FiUsers className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold">892</p>
            </div>
            <FiActivity className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Precisão</p>
              <p className="text-2xl font-bold">78.5%</p>
            </div>
            <FiBarChart className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Retorno</p>
              <p className="text-2xl font-bold">+2.4%</p>
            </div>
            <FiDollarSign className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Seção de Status */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Status do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded">
            <span className="font-medium">API Principal</span>
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">Online</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded">
            <span className="font-medium">Bot Trading</span>
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">Ativo</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded">
            <span className="font-medium">Database</span>
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">Conectado</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded">
            <span className="font-medium">Análise IA</span>
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">Processando</span>
          </div>
        </div>
      </div>

      {/* Operações Recentes */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Operações Recentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Símbolo</th>
                <th className="text-left py-2">Tipo</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">P&L</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">BTC/USDT</td>
                <td className="py-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">LONG</span>
                </td>
                <td className="py-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">ATIVA</span>
                </td>
                <td className="py-2 text-green-600 font-bold">+$45.50</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">ETH/USDT</td>
                <td className="py-2">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">SHORT</span>
                </td>
                <td className="py-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">ATIVA</span>
                </td>
                <td className="py-2 text-red-600 font-bold">-$12.30</td>
              </tr>
              <tr>
                <td className="py-2">ADA/USDT</td>
                <td className="py-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">LONG</span>
                </td>
                <td className="py-2">
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">FECHADA</span>
                </td>
                <td className="py-2 text-green-600 font-bold">+$67.80</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardEmergency;


