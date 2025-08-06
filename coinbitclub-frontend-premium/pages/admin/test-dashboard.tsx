import React, { useState, useEffect } from 'react';

const TestDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Testando API...');
        const response = await fetch('/api/admin/dashboard-complete-fixed');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Dados recebidos:', result);
        
        setData(result);
        setError(null);
      } catch (err) {
        console.error('❌ Erro:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', fontSize: '18px' }}>
        ⏳ Carregando dados...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red', fontSize: '18px' }}>
        ❌ Erro: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎯 Dashboard Test - FUNCIONANDO!</h1>
      
      <div style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>📊 Leitura do Mercado</h2>
        <p><strong>Direção:</strong> {data?.marketReading?.direction}</p>
        <p><strong>Confiança:</strong> {data?.marketReading?.confidence}%</p>
        <p><strong>Justificativa:</strong> {data?.marketReading?.justification}</p>
      </div>

      <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>👥 Usuários</h2>
        <p><strong>Total:</strong> {data?.users?.total}</p>
        <p><strong>Novos hoje:</strong> {data?.users?.newToday}</p>
        <p><strong>Testnet:</strong> {data?.users?.activeTestnet}</p>
        <p><strong>Mainnet:</strong> {data?.users?.activeMainnet}</p>
      </div>

      <div style={{ backgroundColor: '#f0f8e8', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>💰 Performance</h2>
        <p><strong>Assertividade Hoje:</strong> {data?.performance?.accuracy?.today?.toFixed(1)}%</p>
        <p><strong>Retorno Hoje:</strong> ${data?.performance?.returns?.today?.toFixed(2)}</p>
        <p><strong>Retorno Total:</strong> ${data?.performance?.returns?.historical?.toFixed(2)}</p>
      </div>

      <div style={{ backgroundColor: '#f8f0e8', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>⚡ Microserviços</h2>
        <p><strong>Signal Ingestor:</strong> {data?.microservices?.signalIngestor?.status}</p>
        <p><strong>Decision Engine:</strong> {data?.microservices?.decisionEngine?.status}</p>
        <p><strong>Order Executor:</strong> {data?.microservices?.orderExecutor?.status}</p>
      </div>

      <div style={{ backgroundColor: '#e8e8f8', padding: '15px', borderRadius: '8px' }}>
        <h2>📈 Operações</h2>
        <p><strong>Total:</strong> {data?.trading?.totalOperations}</p>
        <p><strong>Abertas:</strong> {data?.trading?.openOperations}</p>
        <p><strong>Lucro Total:</strong> ${data?.trading?.totalProfitLoss?.toFixed(2)}</p>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>✅ Última atualização: {new Date(data?.timestamp).toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );
};

export default TestDashboard;
