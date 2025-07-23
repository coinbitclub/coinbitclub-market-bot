import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';

interface SystemStatus {
  service: string;
  status: 'online' | 'warning' | 'offline';
  uptime: string;
  responseTime: number;
  lastCheck: string;
}

interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  temperature: number;
}

const SystemMonitoring: NextPage = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [isMobile, setIsMobile] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState('5s');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const [systemServices, setSystemServices] = useState<SystemStatus[]>([
    {
      service: 'API Gateway',
      status: 'online',
      uptime: '99.9%',
      responseTime: 45,
      lastCheck: '2025-01-17T14:35:00Z'
    },
    {
      service: 'Trading Engine',
      status: 'online',
      uptime: '99.8%',
      responseTime: 23,
      lastCheck: '2025-01-17T14:35:00Z'
    },
    {
      service: 'Signal Processor',
      status: 'warning',
      uptime: '97.2%',
      responseTime: 156,
      lastCheck: '2025-01-17T14:34:45Z'
    },
    {
      service: 'Database',
      status: 'online',
      uptime: '100%',
      responseTime: 12,
      lastCheck: '2025-01-17T14:35:00Z'
    },
    {
      service: 'Notifications',
      status: 'online',
      uptime: '99.7%',
      responseTime: 78,
      lastCheck: '2025-01-17T14:35:00Z'
    },
    {
      service: 'WebSocket Server',
      status: 'online',
      uptime: '99.5%',
      responseTime: 34,
      lastCheck: '2025-01-17T14:35:00Z'
    }
  ]);

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpu: 23.4,
    memory: 67.2,
    disk: 45.8,
    network: 12.3,
    temperature: 42.8
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simular atualização dos dados
      setSystemHealth(prev => ({
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 5)),
        disk: prev.disk,
        network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 20)),
        temperature: Math.max(0, Math.min(80, prev.temperature + (Math.random() - 0.5) * 2))
      }));
    }, parseInt(refreshInterval) * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #050506 0%, #0a0a0b 25%, #1a1a1c 50%, #050506 100%)',
    color: '#FAFBFD',
    fontFamily: "'Inter', sans-serif"
  };

  const headerStyle = {
    background: 'rgba(5, 167, 78, 0.05)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(5, 167, 78, 0.1)',
    padding: isMobile ? '1rem' : '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100
  };

  const cardStyle = {
    background: 'rgba(5, 167, 78, 0.05)',
    border: '1px solid rgba(5, 167, 78, 0.2)',
    borderRadius: '20px',
    padding: isMobile ? '1.5rem' : '2rem',
    backdropFilter: 'blur(20px)',
    transition: 'all 0.3s ease'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#05A74E';
      case 'warning': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#6EA297';
    }
  };

  const getHealthColor = (value: number, type: string) => {
    if (type === 'temperature') {
      return value > 70 ? '#ef4444' : value > 50 ? '#f59e0b' : '#05A74E';
    }
    return value > 80 ? '#ef4444' : value > 60 ? '#f59e0b' : '#05A74E';
  };

  return (
    <>
      <Head>
        <title>Monitoramento do Sistema - CoinBitClub</title>
      </Head>

      <div style={containerStyle}>
        <header style={headerStyle}>
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #05A74E, #6EA297)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            📊 Monitoramento do Sistema
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ width: '1rem', height: '1rem' }}
              />
              <span style={{ fontSize: '0.875rem', color: '#AFB4B1' }}>Auto Refresh</span>
            </div>
            
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value)}
              style={{
                background: 'rgba(5, 167, 78, 0.1)',
                color: '#05A74E',
                border: '1px solid rgba(5, 167, 78, 0.3)',
                borderRadius: '8px',
                padding: '0.5rem',
                fontSize: '0.875rem'
              }}
            >
              <option value="1">1s</option>
              <option value="5">5s</option>
              <option value="10">10s</option>
              <option value="30">30s</option>
            </select>
          </div>
        </header>

        <main style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: isMobile ? '2rem 1rem' : '3rem 2rem'
        }}>
          {/* Status dos Serviços */}
          <section style={{
            ...cardStyle,
            marginBottom: '3rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '2rem',
              color: '#FAFBFD',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🖥️ Status dos Serviços
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {systemServices.map((service, index) => (
                <div key={index} style={{
                  padding: '1.5rem',
                  background: 'rgba(5, 167, 78, 0.1)',
                  borderRadius: '16px',
                  border: `2px solid ${getStatusColor(service.status)}30`,
                  position: 'relative' as const
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: '#FAFBFD',
                        marginBottom: '0.5rem'
                      }}>
                        {service.service}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#AFB4B1' }}>
                        Uptime: {service.uptime}
                      </p>
                    </div>
                    
                    <div style={{
                      position: 'absolute' as const,
                      top: '1rem',
                      right: '1rem',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: getStatusColor(service.status),
                      animation: service.status === 'online' ? 'pulse 2s infinite' : 'none'
                    }} />
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(5, 167, 78, 0.2)'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: '#AFB4B1' }}>
                      Response Time
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: service.responseTime > 100 ? '#f59e0b' : '#05A74E'
                    }}>
                      {service.responseTime}ms
                    </span>
                  </div>
                  
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#AFB4B1',
                    marginTop: '0.5rem'
                  }}>
                    Última verificação: {new Date(service.lastCheck).toLocaleTimeString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Métricas de Hardware */}
          <section style={cardStyle}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '2rem',
              color: '#FAFBFD',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              💻 Performance do Hardware
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '3rem'
            }}>
              {/* Gráficos de Performance */}
              <div style={{ display: 'grid', gap: '2rem' }}>
                {[
                  { label: 'CPU', value: systemHealth.cpu, icon: '🔥', unit: '%' },
                  { label: 'Memória', value: systemHealth.memory, icon: '💾', unit: '%' },
                  { label: 'Disco', value: systemHealth.disk, icon: '💽', unit: '%' },
                  { label: 'Rede', value: systemHealth.network, icon: '🌐', unit: 'MB/s' },
                  { label: 'Temperatura', value: systemHealth.temperature, icon: '🌡️', unit: '°C' }
                ].map((metric, index) => {
                  return (
                    <div key={index}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{metric.icon}</span>
                        <span style={{ fontSize: '1rem', fontWeight: '600', color: '#FAFBFD' }}>
                          {metric.label}
                        </span>
                        <span style={{
                          fontSize: '1rem',
                          fontWeight: '700',
                          color: getHealthColor(metric.value, metric.label.toLowerCase())
                        }}>
                          {metric.value.toFixed(1)}{metric.unit}
                        </span>
                      </div>
                      
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: 'rgba(5, 167, 78, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: metric.label === 'Rede' ? '100%' : `${Math.min(100, metric.value)}%`,
                          height: '100%',
                          background: getHealthColor(metric.value, metric.label.toLowerCase()),
                          transition: 'all 0.3s ease',
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informações do Sistema */}
              <div style={{
                padding: '2rem',
                background: 'rgba(5, 167, 78, 0.1)',
                borderRadius: '16px',
                border: '1px solid rgba(5, 167, 78, 0.2)'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  marginBottom: '1.5rem',
                  color: '#FAFBFD'
                }}>
                  Informações do Sistema
                </h3>
                
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {[
                    { label: 'SO', value: 'Ubuntu 22.04 LTS' },
                    { label: 'Kernel', value: '5.15.0-89-generic' },
                    { label: 'Node.js', value: 'v18.17.1' },
                    { label: 'Docker', value: '24.0.6' },
                    { label: 'PostgreSQL', value: '15.4' },
                    { label: 'Redis', value: '7.2.1' },
                    { label: 'Nginx', value: '1.22.1' }
                  ].map((info, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0',
                      borderBottom: index < 6 ? '1px solid rgba(5, 167, 78, 0.1)' : 'none'
                    }}>
                      <span style={{ color: '#AFB4B1' }}>{info.label}</span>
                      <span style={{ color: '#FAFBFD', fontWeight: '600' }}>{info.value}</span>
                    </div>
                  ))}
                </div>

                {/* Última atualização */}
                <div style={{
                  marginTop: '2rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(5, 167, 78, 0.2)',
                  textAlign: 'center' as const
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>⏰</span>
                    <span style={{ fontSize: '0.875rem', color: '#AFB4B1' }}>
                      Última atualização: {mounted ? new Date().toLocaleTimeString('pt-BR') : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
};

export default SystemMonitoring;
