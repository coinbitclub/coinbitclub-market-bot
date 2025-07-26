import React from 'react';
import Head from 'next/head';
import { FiCheck, FiX, FiAlertTriangle } from 'react-icons/fi';

const DiagnosticPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Diagnóstico de Design - CoinBitClub</title>
      </Head>
      
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">
            🔧 Diagnóstico de Design
          </h1>
          
          {/* Teste de Cores */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">🎨 Teste de Cores</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-sm">Gray 800</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-sm">Gray 700</div>
              </div>
              <div className="bg-blue-600 p-4 rounded-lg text-center">
                <div className="text-sm">Blue 600</div>
              </div>
              <div className="bg-green-600 p-4 rounded-lg text-center">
                <div className="text-sm">Green 600</div>
              </div>
            </div>
          </div>

          {/* Teste de Gradientes */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">🌈 Teste de Gradientes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-900 to-blue-700 p-6 rounded-lg text-center">
                <div className="text-lg font-medium">Gradiente Azul</div>
              </div>
              <div className="bg-gradient-to-br from-green-900 to-green-700 p-6 rounded-lg text-center">
                <div className="text-lg font-medium">Gradiente Verde</div>
              </div>
              <div className="bg-gradient-to-br from-purple-900 to-purple-700 p-6 rounded-lg text-center">
                <div className="text-lg font-medium">Gradiente Roxo</div>
              </div>
            </div>
          </div>

          {/* Teste de Cards */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">📊 Teste de Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Card Simples</h3>
                  <FiCheck className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-gray-300">Este é um card de teste básico.</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Card Gradiente</h3>
                  <FiAlertTriangle className="w-6 h-6 text-blue-300" />
                </div>
                <p className="text-blue-200">Card com fundo gradiente.</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Card com Borda</h3>
                  <FiX className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-gray-300">Card com borda colorida.</p>
              </div>
            </div>
          </div>

          {/* Teste de Ícones */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">🔥 Teste de Ícones</h2>
            <div className="flex items-center justify-center space-x-8">
              <FiCheck className="w-12 h-12 text-green-400" />
              <FiX className="w-12 h-12 text-red-400" />
              <FiAlertTriangle className="w-12 h-12 text-yellow-400" />
            </div>
          </div>

          {/* Teste de Responsividade */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">📱 Teste de Responsividade</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-700 p-4 rounded text-center">
                  <div className="text-sm">Col 1</div>
                </div>
                <div className="bg-gray-700 p-4 rounded text-center">
                  <div className="text-sm">Col 2</div>
                </div>
                <div className="bg-gray-700 p-4 rounded text-center">
                  <div className="text-sm">Col 3</div>
                </div>
                <div className="bg-gray-700 p-4 rounded text-center">
                  <div className="text-sm">Col 4</div>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-green-900 border border-green-700 rounded-lg p-6 text-center">
            <FiCheck className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-300 mb-2">
              ✅ Design System Funcionando
            </h3>
            <p className="text-green-200">
              Se você pode ver esta página corretamente, o Tailwind CSS está funcionando.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DiagnosticPage;
