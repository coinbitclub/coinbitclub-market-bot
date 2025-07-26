import React from 'react';
import IntegrationTester from '../src/components/IntegrationTester';

// ============================================================================
// 🧪 PÁGINA DE TESTE DE INTEGRAÇÃO COMPLETA
// ============================================================================
// URL: http://localhost:3001/integration-test
// Esta página permite testar toda a integração frontend-backend em tempo real
// ============================================================================

const IntegrationTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚀 CoinBitClub Market Bot
          </h1>
          <h2 className="text-2xl text-gray-700 mb-4">
            Teste de Integração Frontend-Backend
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-blue-800">
              <strong>🎯 Objetivo:</strong> Verificar se a integração entre o frontend Next.js 
              e o backend API Gateway está funcionando perfeitamente.
            </p>
            <div className="mt-4 text-sm text-blue-700">
              <p><strong>Backend:</strong> http://localhost:3000</p>
              <p><strong>Frontend:</strong> http://localhost:3001</p>
              <p><strong>Status:</strong> Integração Ativa ✅</p>
            </div>
          </div>
        </div>

        {/* Componente de teste */}
        <IntegrationTester />

        {/* Instruções */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">
              📋 Instruções de Teste
            </h3>
            
            <div className="space-y-4 text-yellow-700">
              <div>
                <h4 className="font-medium">1. Verificações Automáticas:</h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Health Check do backend (verificar se está online)</li>
                  <li>Status da API (verificar endpoints funcionais)</li>
                  <li>Conectividade completa (teste de comunicação)</li>
                  <li>Sistema de autenticação (verificar configuração)</li>
                  <li>Endpoints públicos (testar sem autenticação)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">2. Próximos Passos:</h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Se todos os testes passaram: Prosseguir com a integração das páginas</li>
                  <li>Se houve falhas: Verificar se o backend está rodando</li>
                  <li>Testar login de usuário e operações autenticadas</li>
                  <li>Integrar dashboards e componentes dinâmicos</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">3. Comandos de Diagnóstico:</h4>
                <div className="bg-yellow-100 p-3 rounded mt-2 font-mono text-sm">
                  <p># Verificar se backend está rodando:</p>
                  <p>curl http://localhost:3000/health</p>
                  <p className="mt-2"># Iniciar backend se não estiver:</p>
                  <p>npm start (na pasta backend/api-gateway)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Links úteis */}
        <div className="mt-8 text-center">
          <div className="inline-flex space-x-4">
            <a
              href="/dashboard"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              📊 Ir para Dashboard
            </a>
            <a
              href="/login"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              🔐 Página de Login
            </a>
            <a
              href="/"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              🏠 Página Inicial
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationTestPage;
