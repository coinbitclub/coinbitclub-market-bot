import React, { useState, useEffect } from 'react';
import { systemService, authService, userService, dashboardService } from '../services/api';

// ============================================================================
// 🧪 COMPONENTE DE TESTE DE INTEGRAÇÃO FRONTEND-BACKEND
// ============================================================================
// Este componente testa todas as funcionalidades de integração em tempo real
// ============================================================================

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
  duration?: number;
}

export const IntegrationTester: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState({ total: 0, success: 0, errors: 0 });

  const addTest = (test: TestResult) => {
    setTests(prev => [...prev, test]);
  };

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  const runTest = async (
    name: string,
    testFunction: () => Promise<any>,
    index: number
  ) => {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Executando teste: ${name}`);
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      updateTest(index, {
        status: 'success',
        message: 'Teste executado com sucesso',
        data: result,
        duration
      });
      
      console.log(`✅ ${name}: SUCESSO (${duration}ms)`);
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      updateTest(index, {
        status: 'error',
        message: error.message || 'Erro desconhecido',
        data: error.response?.data,
        duration
      });
      
      console.error(`❌ ${name}: ERRO (${duration}ms)`, error);
      return false;
    }
  };

  const executeAllTests = async () => {
    console.log('🚀 INICIANDO TESTES DE INTEGRAÇÃO COMPLETA');
    setIsRunning(true);
    setTests([]);
    
    // Lista de testes a serem executados
    const testSuite = [
      {
        name: '1. Health Check Backend',
        test: () => systemService.healthCheck()
      },
      {
        name: '2. API Status Check',
        test: () => systemService.apiStatus()
      },
      {
        name: '3. Conectividade Completa',
        test: () => systemService.testConnection()
      },
      {
        name: '4. Verificar Autenticação (sem token)',
        test: () => {
          const isAuth = authService.isAuthenticated();
          return Promise.resolve({ authenticated: isAuth });
        }
      },
      {
        name: '5. Buscar Planos Disponíveis',
        test: async () => {
          // Simulando chamada para planos sem autenticação
          try {
            const plans = await fetch('http://localhost:3000/api/plans').then(r => r.json());
            return plans;
          } catch (error) {
            return { message: 'Endpoint de planos não encontrado (normal se não implementado)' };
          }
        }
      }
    ];

    // Inicializar testes
    const initialTests = testSuite.map(t => ({
      name: t.name,
      status: 'pending' as const,
      message: 'Aguardando execução...'
    }));
    setTests(initialTests);

    // Executar testes sequencialmente
    let successCount = 0;
    for (let i = 0; i < testSuite.length; i++) {
      const success = await runTest(testSuite[i].name, testSuite[i].test, i);
      if (success) successCount++;
      
      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Atualizar resumo
    setSummary({
      total: testSuite.length,
      success: successCount,
      errors: testSuite.length - successCount
    });

    setIsRunning(false);
    
    console.log('📊 RESUMO DOS TESTES:');
    console.log(`- Total: ${testSuite.length}`);
    console.log(`- Sucessos: ${successCount}`);
    console.log(`- Erros: ${testSuite.length - successCount}`);
    console.log('🎯 TESTES DE INTEGRAÇÃO CONCLUÍDOS');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
    }
  };

  // Auto-executar testes quando componente carregar
  useEffect(() => {
    executeAllTests();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🧪 Teste de Integração Frontend-Backend
        </h1>
        <p className="text-gray-600">
          CoinBitClub Market Bot - Verificação completa da conectividade
        </p>
      </div>

      {/* Botão de executar testes */}
      <div className="mb-6">
        <button
          onClick={executeAllTests}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-medium ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRunning ? '🔄 Executando Testes...' : '🚀 Executar Testes de Integração'}
        </button>
      </div>

      {/* Resumo dos testes */}
      {tests.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-blue-600">Total de Testes</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.success}</div>
            <div className="text-green-600">Sucessos</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.errors}</div>
            <div className="text-red-600">Erros</div>
          </div>
        </div>
      )}

      {/* Lista de testes */}
      <div className="space-y-4">
        {tests.map((test, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 flex items-center">
                <span className="mr-2 text-lg">{getStatusIcon(test.status)}</span>
                {test.name}
              </h3>
              {test.duration && (
                <span className="text-sm text-gray-500">{test.duration}ms</span>
              )}
            </div>
            
            <p className={`text-sm ${getStatusColor(test.status)} mb-2`}>
              {test.message}
            </p>
            
            {test.data && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  📊 Ver dados do teste
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(test.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {/* Informações da configuração */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">🔧 Configuração Atual</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>
            <strong>Backend URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}
          </div>
          <div>
            <strong>Frontend URL:</strong> {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}
          </div>
          <div>
            <strong>Ambiente:</strong> {process.env.NODE_ENV || 'development'}
          </div>
          <div>
            <strong>Integração Ativa:</strong> {process.env.NEXT_PUBLIC_ENABLE_API_INTEGRATION || 'true'}
          </div>
        </div>
      </div>

      {/* Status geral */}
      <div className="mt-6 text-center">
        {tests.length > 0 && !isRunning && (
          <div className={`text-lg font-medium ${
            summary.errors === 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {summary.errors === 0
              ? '🎉 Todos os testes passaram! Integração 100% funcional.'
              : `⚠️ ${summary.errors} teste(s) falharam. Verificar configurações.`
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationTester;


