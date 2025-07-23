import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { checkApiStatus, apiClient } from '../lib/api';

interface ConnectionStatus {
  status: 'online' | 'offline' | 'error' | 'checking';
  latency?: number;
  error?: string;
  lastChecked?: Date;
}

interface ServiceStatus {
  name: string;
  endpoint: string;
  status: ConnectionStatus;
}

export default function IntegrationCheck() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'checking'
  });
  
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'API Gateway', endpoint: '/api/health', status: { status: 'checking' } },
    { name: 'Database', endpoint: '/api/db/status', status: { status: 'checking' } },
    { name: 'RabbitMQ', endpoint: '/api/rabbitmq/status', status: { status: 'checking' } },
    { name: 'Signal Processor', endpoint: '/api/signals/status', status: { status: 'checking' } },
    { name: 'Decision Engine', endpoint: '/api/decisions/status', status: { status: 'checking' } },
    { name: 'Order Executor', endpoint: '/api/orders/status', status: { status: 'checking' } },
  ]);

  const [testResults, setTestResults] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    checkAllConnections();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(checkAllConnections, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAllConnections = async () => {
    console.log('🔍 Verificando conexões...');
    
    // Check main API connection
    const mainStatus = await checkApiStatus();
    setConnectionStatus({
      ...mainStatus,
      lastChecked: new Date()
    });

    // Check individual services
    const updatedServices = await Promise.all(
      services.map(async (service) => {
        try {
          const startTime = performance.now();
          const response = await apiClient.healthCheck();
          const latency = performance.now() - startTime;
          
          return {
            ...service,
            status: {
              status: response.success ? 'online' : 'error',
              latency: Math.round(latency),
              error: response.error,
              lastChecked: new Date()
            } as ConnectionStatus
          };
        } catch (error) {
          return {
            ...service,
            status: {
              status: 'offline',
              error: error instanceof Error ? error.message : 'Connection failed',
              lastChecked: new Date()
            } as ConnectionStatus
          };
        }
      })
    );
    
    setServices(updatedServices);
  };

  const runIntegrationTests = async () => {
    console.log('🧪 Executando testes de integração...');
    const results: { [key: string]: any } = {};

    // Test 1: API Health Check
    try {
      const health = await apiClient.healthCheck();
      results.healthCheck = {
        success: health.success,
        data: health.data,
        error: health.error
      };
    } catch (error) {
      results.healthCheck = {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }

    // Test 2: Database Connection (simulated)
    try {
      const dbTest = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/test/db`);
      results.database = {
        success: dbTest.ok,
        status: dbTest.status,
        statusText: dbTest.statusText
      };
    } catch (error) {
      results.database = {
        success: false,
        error: error instanceof Error ? error.message : 'Database test failed'
      };
    }

    // Test 3: WebSocket Connection (simulated)
    try {
      results.websocket = {
        success: false,
        message: 'WebSocket test not implemented yet'
      };
    } catch (error) {
      results.websocket = {
        success: false,
        error: error instanceof Error ? error.message : 'WebSocket test failed'
      };
    }

    setTestResults(results);
    console.log('📊 Resultados dos testes:', results);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#00FF00';
      case 'offline': return '#FF0000';
      case 'error': return '#FFA500';
      case 'checking': return '#FFFF00';
      default: return '#888888';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '✅';
      case 'offline': return '❌';
      case 'error': return '⚠️';
      case 'checking': return '🔄';
      default: return '❓';
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
    color: '#FFFFFF',
    fontFamily: 'Arial, sans-serif',
    padding: '2rem'
  };

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
  };

  const buttonStyle: React.CSSProperties = {
    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    color: '#000',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    margin: '0.5rem'
  };

  return (
    <>
      <Head>
        <title>Verificação de Integração - CoinBitClub</title>
        <meta name="description" content="Verificação da integração frontend-backend" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#FFD700', textDecoration: 'none', fontSize: '1.5rem' }}>
            ⚡ CoinBitClub
          </Link>
          <h1 style={{ 
            color: '#FFD700', 
            fontSize: '2.5rem', 
            margin: '1rem 0',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
          }}>
            🔗 Verificação de Integração Frontend-Backend
          </h1>
          <p style={{ color: '#B0B3B8', fontSize: '1.1rem' }}>
            Status em tempo real da conectividade entre frontend e backend
          </p>
        </header>

        {/* Status Geral */}
        <div style={cardStyle}>
          <h2 style={{ color: '#00BFFF', marginBottom: '1rem' }}>📊 Status Geral da API</h2>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            fontSize: '1.2rem' 
          }}>
            <span style={{ fontSize: '2rem' }}>
              {getStatusIcon(connectionStatus.status)}
            </span>
            <div>
              <div style={{ color: getStatusColor(connectionStatus.status) }}>
                Status: {connectionStatus.status.toUpperCase()}
              </div>
              {connectionStatus.latency && (
                <div style={{ color: '#888', fontSize: '0.9rem' }}>
                  Latência: {connectionStatus.latency}ms
                </div>
              )}
              {connectionStatus.lastChecked && (
                <div style={{ color: '#888', fontSize: '0.9rem' }}>
                  Última verificação: {connectionStatus.lastChecked.toLocaleTimeString()}
                </div>
              )}
              {connectionStatus.error && (
                <div style={{ color: '#FF6B6B', fontSize: '0.9rem' }}>
                  Erro: {connectionStatus.error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status dos Serviços */}
        <div style={cardStyle}>
          <h2 style={{ color: '#00BFFF', marginBottom: '1rem' }}>🛠️ Status dos Serviços</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {services.map((service, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: `1px solid ${getStatusColor(service.status.status)}33`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{getStatusIcon(service.status.status)}</span>
                  <span style={{ fontWeight: 'bold' }}>{service.name}</span>
                  <code style={{ color: '#888', fontSize: '0.8rem' }}>{service.endpoint}</code>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
                  <div style={{ color: getStatusColor(service.status.status) }}>
                    {service.status.status.toUpperCase()}
                  </div>
                  {service.status.latency && (
                    <div style={{ color: '#888' }}>{service.status.latency}ms</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testes de Integração */}
        <div style={cardStyle}>
          <h2 style={{ color: '#00BFFF', marginBottom: '1rem' }}>🧪 Testes de Integração</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <button 
              style={buttonStyle}
              onClick={runIntegrationTests}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🧪 Executar Testes
            </button>
            
            <button 
              style={{...buttonStyle, background: 'linear-gradient(45deg, #00BFFF, #0080FF)'}}
              onClick={checkAllConnections}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 191, 255, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🔄 Atualizar Status
            </button>
          </div>

          {Object.keys(testResults).length > 0 && (
            <div>
              <h3 style={{ color: '#FF69B4', marginBottom: '1rem' }}>📋 Resultados dos Testes</h3>
              <pre style={{
                background: '#000',
                padding: '1rem',
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '0.9rem',
                color: '#00FF00',
                border: '1px solid #333'
              }}>
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Configuração */}
        <div style={cardStyle}>
          <h2 style={{ color: '#00BFFF', marginBottom: '1rem' }}>⚙️ Configuração</h2>
          <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div>
              <strong>API Base URL:</strong> 
              <code style={{ marginLeft: '0.5rem', color: '#FFD700' }}>
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}
              </code>
            </div>
            <div>
              <strong>Frontend URL:</strong> 
              <code style={{ marginLeft: '0.5rem', color: '#FFD700' }}>
                {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3006'}
              </code>
            </div>
            <div>
              <strong>Environment:</strong> 
              <code style={{ marginLeft: '0.5rem', color: '#FFD700' }}>
                {process.env.NODE_ENV || 'development'}
              </code>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href="/" style={{...buttonStyle, textDecoration: 'none', display: 'inline-block'}}>
            🏠 Voltar ao Início
          </Link>
          <Link href="/dashboard" style={{...buttonStyle, textDecoration: 'none', display: 'inline-block', background: 'linear-gradient(45deg, #FF69B4, #FF1493)'}}>
            📊 Dashboard
          </Link>
          <Link href="/test-all-pages" style={{...buttonStyle, textDecoration: 'none', display: 'inline-block', background: 'linear-gradient(45deg, #00BFFF, #0080FF)'}}>
            🔧 Testar Páginas
          </Link>
        </div>
      </div>
    </>
  );
}
