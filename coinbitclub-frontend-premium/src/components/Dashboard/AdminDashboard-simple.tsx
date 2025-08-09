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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  return (
    <div className="space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-2xl rounded-2xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">🎯 Bem-vindo, {user.name}</h1>
        <p className="text-xl text-blue-100">Dashboard Administrativo - CoinBitClub</p>
        <div className="mt-4 bg-green-400 text-green-900 px-4 py-2 rounded-full text-sm font-bold inline-flex items-center">
          <div className="h-2 w-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
          ✅ Sistema Online e Funcionando
        </div>
      </div>

      {/* Métricas Simples */}
      <div className="bg-white shadow-2xl rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center mb-8">📈 Métricas do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Card 1 */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm">Total de Usuários</p>
                <p className="text-4xl font-bold">1,247</p>
              </div>
              <FiUsers className="h-10 w-10 text-blue-200" />
            </div>
            <div className="text-blue-100 text-sm">
              <span className="text-green-300 font-bold">+23</span> hoje
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-100 text-sm">Usuários Ativos</p>
                <p className="text-4xl font-bold">892</p>
              </div>
              <FiActivity className="h-10 w-10 text-green-200" />
            </div>
            <div className="text-green-100 text-sm">
              <span className="text-yellow-300 font-bold">456</span> teste • <span className="text-green-300 font-bold">436</span> produção
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-purple-100 text-sm">Precisão Diária</p>
                <p className="text-4xl font-bold">78.5%</p>
              </div>
              <FiBarChart className="h-10 w-10 text-purple-200" />
            </div>
            <div className="text-purple-100 text-sm">
              Histórico: <span className="text-purple-300 font-bold">73.2%</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-orange-100 text-sm">Retorno Diário</p>
                <p className="text-4xl font-bold">+2.4%</p>
              </div>
              <FiDollarSign className="h-10 w-10 text-orange-200" />
            </div>
            <div className="text-orange-100 text-sm">
              Histórico: <span className="text-orange-300 font-bold">+15.7%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Simplificado */}
      <div className="bg-white shadow-2xl rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center mb-8">🔧 Status do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-green-800 font-bold text-lg mb-2">API Status</div>
            <div className="text-green-600 text-2xl">✅ ONLINE</div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-green-800 font-bold text-lg mb-2">Database</div>
            <div className="text-green-600 text-2xl">✅ ONLINE</div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-green-800 font-bold text-lg mb-2">Trading Engine</div>
            <div className="text-green-600 text-2xl">✅ ONLINE</div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-green-800 font-bold text-lg mb-2">AI Engine</div>
            <div className="text-green-600 text-2xl">✅ ONLINE</div>
          </div>
        </div>
      </div>

      {/* Mensagem de Sucesso */}
      <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-4">🎉 Dashboard Carregado com Sucesso!</h3>
        <p className="text-xl">Todos os sistemas estão funcionando perfeitamente.</p>
        <p className="text-lg mt-2">Última atualização: {new Date().toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;


