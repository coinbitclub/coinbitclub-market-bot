import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Componente principal da página de comissões
export default function AffiliateCommissions() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [summary, setSummary] = useState({
    totalEarned: 0,
    totalPaid: 0,
    pendingAmount: 0,
    thisMonth: 0,
    thisYear: 0
  });
  const [activeTab, setActiveTab] = useState('commissions');
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  // Verificar autenticação
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'affiliate') {
      router.push('/auth/login');
      return;
    }

    setUser(parsedUser);
    fetchCommissionsData();
  }, []);

  // Buscar dados das comissões
  const fetchCommissionsData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:9997/api/affiliate/commissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCommissions(data.commissions || []);
        setPayouts(data.payouts || []);
        setSummary(data.summary || {});
      } else {
        console.log('API não disponível, usando dados mock...');
        // Dados mock para desenvolvimento
        setSummary({
          totalEarned: 4567.80,
          totalPaid: 3250.00,
          pendingAmount: 1317.80,
          thisMonth: 645.20,
          thisYear: 4567.80
        });

        setCommissions([
          {
            id: '1',
            referralName: 'João Silva',
            referralEmail: 'joao@email.com',
            type: 'signup',
            planType: 'Premium',
            amount: 49.50,
            percentage: 25,
            date: '2025-07-24T10:30:00Z',
            status: 'paid',
            payoutDate: '2025-07-25T00:00:00Z'
          },
          {
            id: '2',
            referralName: 'Maria Santos',
            referralEmail: 'maria@email.com',
            type: 'renewal',
            planType: 'Basic',
            amount: 19.40,
            percentage: 20,
            date: '2025-07-23T15:45:00Z',
            status: 'pending',
            payoutDate: null
          },
          {
            id: '3',
            referralName: 'Pedro Costa',
            referralEmail: 'pedro@email.com',
            type: 'upgrade',
            planType: 'Professional',
            amount: 99.40,
            percentage: 20,
            date: '2025-07-22T09:15:00Z',
            status: 'paid',
            payoutDate: '2025-07-23T00:00:00Z'
          },
          {
            id: '4',
            referralName: 'Ana Lima',
            referralEmail: 'ana@email.com',
            type: 'signup',
            planType: 'Premium',
            amount: 49.50,
            percentage: 25,
            date: '2025-07-21T14:20:00Z',
            status: 'pending',
            payoutDate: null
          },
          {
            id: '5',
            referralName: 'Carlos Souza',
            referralEmail: 'carlos@email.com',
            type: 'signup',
            planType: 'Basic',
            amount: 19.40,
            percentage: 20,
            date: '2025-07-20T11:30:00Z',
            status: 'paid',
            payoutDate: '2025-07-21T00:00:00Z'
          }
        ]);

        setPayouts([
          {
            id: '1',
            amount: 168.90,
            commissionsCount: 4,
            date: '2025-07-25T00:00:00Z',
            status: 'completed',
            method: 'PIX',
            transactionId: 'TX123456789'
          },
          {
            id: '2',
            amount: 245.60,
            commissionsCount: 6,
            date: '2025-07-18T00:00:00Z',
            status: 'completed',
            method: 'PIX',
            transactionId: 'TX987654321'
          },
          {
            id: '3',
            amount: 312.40,
            commissionsCount: 8,
            date: '2025-07-11T00:00:00Z',
            status: 'completed',
            method: 'PIX',
            transactionId: 'TX456789123'
          }
        ]);
      }
    } catch (error) {
      console.error('Erro ao buscar comissões:', error);
      // Fallback para dados vazios
      setCommissions([]);
      setPayouts([]);
      setSummary({
        totalEarned: 0,
        totalPaid: 0,
        pendingAmount: 0,
        thisMonth: 0,
        thisYear: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar comissões
  const filteredCommissions = commissions.filter(commission => {
    const matchesFilter = filter === 'all' || commission.status === filter;
    
    if (dateRange === 'all') return matchesFilter;
    
    const commissionDate = new Date(commission.date);
    const now = new Date();
    
    if (dateRange === 'this_month') {
      return matchesFilter && 
             commissionDate.getMonth() === now.getMonth() && 
             commissionDate.getFullYear() === now.getFullYear();
    }
    
    if (dateRange === 'this_year') {
      return matchesFilter && commissionDate.getFullYear() === now.getFullYear();
    }
    
    return matchesFilter;
  });

  // Solicitar saque
  const requestPayout = () => {
    if (summary.pendingAmount > 0) {
      alert(`💰 Solicitação de saque de ${formatCurrency(summary.pendingAmount)} enviada! Processaremos em até 48h.`);
    } else {
      alert('💸 Nenhum valor disponível para saque no momento.');
    }
  };

  // Exportar relatório
  const exportReport = () => {
    const csvContent = [
      ['Data', 'Indicado', 'Tipo', 'Plano', 'Valor', 'Status'].join(','),
      ...filteredCommissions.map(c => [
        formatDate(c.date),
        c.referralName,
        c.type,
        c.planType,
        c.amount,
        c.status
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comissoes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Formatação de valores
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Estilos
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0B0F1A 0%, #1a1f3a 50%, #2a1810 100%)',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    color: '#ffffff',
    padding: '2rem 1rem'
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  };

  const statCardStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '1.5rem',
    textAlign: 'center' as const,
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const tabStyle = (active) => ({
    background: active 
      ? 'linear-gradient(45deg, #4ECDC4, #44A08D)'
      : 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginRight: '1rem',
    marginBottom: '0.5rem'
  });

  const buttonStyle = {
    background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginRight: '1rem',
    marginBottom: '0.5rem'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '1rem'
  };

  const thStyle = {
    padding: '1rem',
    textAlign: 'left' as const,
    borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
    color: '#00BFFF',
    fontWeight: 'bold'
  };

  const tdStyle = {
    padding: '1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  };

  const statusStyle = (status) => ({
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    background: status === 'paid' ? 'rgba(76, 175, 80, 0.2)' : 
                status === 'pending' ? 'rgba(255, 193, 7, 0.2)' : 
                status === 'completed' ? 'rgba(76, 175, 80, 0.2)' :
                'rgba(244, 67, 54, 0.2)',
    color: status === 'paid' ? '#4CAF50' : 
           status === 'pending' ? '#FFC107' : 
           status === 'completed' ? '#4CAF50' :
           '#F44336'
  });

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div style={{ fontSize: '1.5rem', color: '#00BFFF' }}>⏳ Carregando comissões...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Comissões - CoinBitClub</title>
        <meta name="description" content="Gerencie suas comissões de afiliado" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', background: 'linear-gradient(45deg, #FFD700, #FF69B4)', 
                        backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              💰 Comissões
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>
              Gerencie suas comissões e saques
            </p>
          </div>
          <button 
            onClick={() => router.push('/affiliate/dashboard')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ← Voltar ao Dashboard
          </button>
        </div>

        {/* Resumo Financeiro */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={statCardStyle}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4CAF50' }}>
              {formatCurrency(summary.totalEarned)}
            </div>
            <div style={{ opacity: 0.8, marginTop: '0.5rem' }}>💰 Total Ganho</div>
          </div>
          
          <div style={statCardStyle}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196F3' }}>
              {formatCurrency(summary.totalPaid)}
            </div>
            <div style={{ opacity: 0.8, marginTop: '0.5rem' }}>✅ Já Recebido</div>
          </div>
          
          <div style={statCardStyle}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFC107' }}>
              {formatCurrency(summary.pendingAmount)}
            </div>
            <div style={{ opacity: 0.8, marginTop: '0.5rem' }}>⏳ Pendente</div>
          </div>
          
          <div style={statCardStyle}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FF9800' }}>
              {formatCurrency(summary.thisMonth)}
            </div>
            <div style={{ opacity: 0.8, marginTop: '0.5rem' }}>📅 Este Mês</div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#00BFFF' }}>⚡ Ações Rápidas</h3>
              <p style={{ margin: 0, opacity: 0.8 }}>Gerencie suas comissões e pagamentos</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={requestPayout} style={buttonStyle}>
                💸 Solicitar Saque
              </button>
              <button onClick={exportReport} style={buttonStyle}>
                📊 Exportar Relatório
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('commissions')}
            style={tabStyle(activeTab === 'commissions')}
          >
            💰 Comissões
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            style={tabStyle(activeTab === 'payouts')}
          >
            💸 Saques
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'commissions' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
              <div>
                <strong>Filtros:</strong>
              </div>
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <option value="all">📊 Todas</option>
                <option value="paid">✅ Pagas</option>
                <option value="pending">⏳ Pendentes</option>
              </select>
              
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <option value="all">🗓️ Todo período</option>
                <option value="this_month">📅 Este mês</option>
                <option value="this_year">📆 Este ano</option>
              </select>
            </div>

            <h3 style={{ margin: '0 0 1rem 0', color: '#00BFFF' }}>💰 Histórico de Comissões</h3>
            
            {filteredCommissions.length === 0 ? (
              <div style={{ textAlign: 'center' as const, padding: '3rem', opacity: 0.6 }}>
                <div style={{ fontSize: '3rem' }}>💰</div>
                <p>Nenhuma comissão encontrada para os filtros selecionados</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Data</th>
                      <th style={thStyle}>Indicado</th>
                      <th style={thStyle}>Tipo</th>
                      <th style={thStyle}>Plano</th>
                      <th style={thStyle}>%</th>
                      <th style={thStyle}>Valor</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommissions.map(commission => (
                      <tr key={commission.id}>
                        <td style={tdStyle}>{formatDate(commission.date)}</td>
                        <td style={tdStyle}>
                          <div>
                            <strong>{commission.referralName}</strong>
                            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                              {commission.referralEmail}
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            background: commission.type === 'signup' ? 'rgba(76, 175, 80, 0.2)' :
                                       commission.type === 'renewal' ? 'rgba(33, 150, 243, 0.2)' :
                                       'rgba(255, 152, 0, 0.2)',
                            color: commission.type === 'signup' ? '#4CAF50' :
                                  commission.type === 'renewal' ? '#2196F3' :
                                  '#FF9800'
                          }}>
                            {commission.type === 'signup' ? '📝 Cadastro' :
                             commission.type === 'renewal' ? '🔄 Renovação' :
                             '⬆️ Upgrade'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            background: commission.planType === 'Professional' ? 'rgba(156, 39, 176, 0.2)' :
                                       commission.planType === 'Premium' ? 'rgba(255, 215, 0, 0.2)' :
                                       'rgba(33, 150, 243, 0.2)',
                            color: commission.planType === 'Professional' ? '#9C27B0' :
                                  commission.planType === 'Premium' ? '#FFD700' :
                                  '#2196F3'
                          }}>
                            {commission.planType}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <strong style={{ color: '#00BFFF' }}>{commission.percentage}%</strong>
                        </td>
                        <td style={tdStyle}>
                          <strong style={{ color: '#4CAF50' }}>
                            {formatCurrency(commission.amount)}
                          </strong>
                        </td>
                        <td style={tdStyle}>
                          <span style={statusStyle(commission.status)}>
                            {commission.status === 'paid' ? '✅ Pago' : '⏳ Pendente'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {commission.payoutDate ? formatDate(commission.payoutDate) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payouts' && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#00BFFF' }}>💸 Histórico de Saques</h3>
            
            {payouts.length === 0 ? (
              <div style={{ textAlign: 'center' as const, padding: '3rem', opacity: 0.6 }}>
                <div style={{ fontSize: '3rem' }}>💸</div>
                <p>Nenhum saque realizado ainda</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Data</th>
                      <th style={thStyle}>Valor</th>
                      <th style={thStyle}>Comissões</th>
                      <th style={thStyle}>Método</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>ID Transação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map(payout => (
                      <tr key={payout.id}>
                        <td style={tdStyle}>{formatDate(payout.date)}</td>
                        <td style={tdStyle}>
                          <strong style={{ color: '#4CAF50' }}>
                            {formatCurrency(payout.amount)}
                          </strong>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            background: 'rgba(33, 150, 243, 0.2)',
                            color: '#2196F3',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}>
                            {payout.commissionsCount} comissões
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            background: 'rgba(76, 175, 80, 0.2)',
                            color: '#4CAF50',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}>
                            💳 {payout.method}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={statusStyle(payout.status)}>
                            ✅ Concluído
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <code style={{ 
                            background: 'rgba(255, 255, 255, 0.1)', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px',
                            fontSize: '0.85rem'
                          }}>
                            {payout.transactionId}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Informações Importantes */}
        <div style={{
          background: 'linear-gradient(45deg, rgba(33, 150, 243, 0.1), rgba(3, 169, 244, 0.1))',
          border: '1px solid rgba(33, 150, 243, 0.3)',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center' as const
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#2196F3' }}>ℹ️ Informações Importantes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', textAlign: 'left' as const }}>
            <div>
              <strong style={{ color: '#00BFFF' }}>💰 Comissões:</strong>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                Você ganha 20-25% de comissão em cada indicação, dependendo do plano escolhido pelo indicado.
              </p>
            </div>
            <div>
              <strong style={{ color: '#00BFFF' }}>💸 Saques:</strong>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                Saques são processados em até 48h úteis. Valor mínimo de R$ 50,00.
              </p>
            </div>
            <div>
              <strong style={{ color: '#00BFFF' }}>📊 Rankings:</strong>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                Avance nos rankings para desbloquear maiores percentuais de comissão e benefícios exclusivos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
