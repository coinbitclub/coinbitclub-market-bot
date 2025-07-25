import React from 'react';
import { ChartBarIcon, CurrencyDollarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function SimpleDashboard() {
  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#0B0F1E', // --background
    color: '#F9FAFB', // --foreground
    padding: '2rem'
  };

  const cardStyle = {
    backgroundColor: '#1F2937', // --card
    border: '1px solid #4B5563', // --border
    borderRadius: '0.5rem',
    padding: '1.5rem',
    marginBottom: '1.5rem'
  };

  const primaryColor = '#00FFD1';
  const accentColor = '#FFC300';
  const mutedColor = '#9CA3AF';

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: primaryColor }}>
            Dashboard
          </h1>
          <p style={{ color: mutedColor }}>
            Acompanhe suas métricas e posições em tempo real
          </p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: mutedColor }}>Total Balance</h3>
              <CurrencyDollarIcon style={{ width: '20px', height: '20px', color: primaryColor }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: primaryColor }}>
              $25,431.78
            </div>
            <div style={{ fontSize: '0.875rem', color: '#22C55E' }}>
              +12.5% este mês
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: mutedColor }}>P&L Hoje</h3>
              <ArrowTrendingUpIcon style={{ width: '20px', height: '20px', color: accentColor }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22C55E' }}>
              +$1,247.32
            </div>
            <div style={{ fontSize: '0.875rem', color: '#22C55E' }}>
              +4.9% hoje
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: mutedColor }}>Accuracy Rate</h3>
              <ChartBarIcon style={{ width: '20px', height: '20px', color: primaryColor }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              87.3%
            </div>
            <div style={{ fontSize: '0.875rem', color: mutedColor }}>
              156 trades total
            </div>
          </div>

        </div>

        {/* Export Buttons */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Exportar Dados
          </h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{
              backgroundColor: primaryColor,
              color: '#0B0F1E',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Export CSV
            </button>
            <button style={{
              backgroundColor: accentColor,
              color: '#0B0F1E',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Export JSON
            </button>
          </div>
        </div>

        {/* Test Section */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Debug: Tailwind vs Inline Styles
          </h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Inline Styles (Should Work):</h3>
            <div style={{ backgroundColor: primaryColor, color: '#0B0F1E', padding: '1rem', borderRadius: '0.375rem', marginBottom: '0.5rem' }}>
              Background: {primaryColor} (Primary)
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>Tailwind Classes (May Not Work):</h3>
            <div className="rounded-md bg-primary p-4 text-primary-foreground">
              Background: bg-primary (Should be #00FFD1)
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
