import React from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  user_type: string;
}

interface AdminDashboardProps {
  user: User;
}

const AdminDashboardUltraSimple: React.FC<AdminDashboardProps> = ({ user }) => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#2563eb', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
          🎯 Dashboard Admin - {user.name}
        </h1>
        <p style={{ margin: '0', opacity: '0.8' }}>
          Sistema CoinBitClub Online e Funcionando
        </p>
      </div>

      {/* Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>Total de Usuários</h3>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#2563eb' }}>
            1,247
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>Usuários Ativos</h3>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
            892
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>Precisão do Bot</h3>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>
            78.5%
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>Retorno Diário</h3>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
            +2.4%
          </p>
        </div>
      </div>

      {/* Status */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#374151' }}>Status do Sistema</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#dcfce7',
            borderRadius: '6px'
          }}>
            <span style={{ fontWeight: '500' }}>API Principal</span>
            <span style={{ 
              backgroundColor: '#10b981', 
              color: 'white', 
              padding: '4px 12px', 
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              ONLINE
            </span>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#dcfce7',
            borderRadius: '6px'
          }}>
            <span style={{ fontWeight: '500' }}>Bot Trading</span>
            <span style={{ 
              backgroundColor: '#10b981', 
              color: 'white', 
              padding: '4px 12px', 
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              ATIVO
            </span>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#dcfce7',
            borderRadius: '6px'
          }}>
            <span style={{ fontWeight: '500' }}>Database</span>
            <span style={{ 
              backgroundColor: '#10b981', 
              color: 'white', 
              padding: '4px 12px', 
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              CONECTADO
            </span>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#dcfce7',
            borderRadius: '6px'
          }}>
            <span style={{ fontWeight: '500' }}>IA Análise</span>
            <span style={{ 
              backgroundColor: '#10b981', 
              color: 'white', 
              padding: '4px 12px', 
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              PROCESSANDO
            </span>
          </div>
        </div>
      </div>

      {/* Operações */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#374151' }}>Operações Recentes</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#374151' }}>Símbolo</th>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#374151' }}>Tipo</th>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#374151' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#374151' }}>P&L</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 0' }}>BTC/USDT</td>
                <td style={{ padding: '12px 0' }}>
                  <span style={{ 
                    backgroundColor: '#dcfce7', 
                    color: '#166534', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    LONG
                  </span>
                </td>
                <td style={{ padding: '12px 0' }}>
                  <span style={{ 
                    backgroundColor: '#dbeafe', 
                    color: '#1e40af', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    ATIVA
                  </span>
                </td>
                <td style={{ padding: '12px 0', color: '#10b981', fontWeight: 'bold' }}>+$45.50</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 0' }}>ETH/USDT</td>
                <td style={{ padding: '12px 0' }}>
                  <span style={{ 
                    backgroundColor: '#fee2e2', 
                    color: '#991b1b', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    SHORT
                  </span>
                </td>
                <td style={{ padding: '12px 0' }}>
                  <span style={{ 
                    backgroundColor: '#dbeafe', 
                    color: '#1e40af', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    ATIVA
                  </span>
                </td>
                <td style={{ padding: '12px 0', color: '#ef4444', fontWeight: 'bold' }}>-$12.30</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 0' }}>ADA/USDT</td>
                <td style={{ padding: '12px 0' }}>
                  <span style={{ 
                    backgroundColor: '#dcfce7', 
                    color: '#166534', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    LONG
                  </span>
                </td>
                <td style={{ padding: '12px 0' }}>
                  <span style={{ 
                    backgroundColor: '#f3f4f6', 
                    color: '#374151', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    FECHADA
                  </span>
                </td>
                <td style={{ padding: '12px 0', color: '#10b981', fontWeight: 'bold' }}>+$67.80</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '30px', 
        padding: '20px',
        color: '#6b7280'
      }}>
        <p>✅ Sistema CoinBitClub funcionando perfeitamente!</p>
        <p>Última atualização: {new Date().toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );
};

export default AdminDashboardUltraSimple;


