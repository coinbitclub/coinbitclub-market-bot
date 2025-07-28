import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';

const AffiliateSimple: NextPage = () => {
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    country: '',
    acceptTerms: false
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    zIndex: 100,
    flexWrap: 'wrap' as const
  };

  const logoStyle = {
    fontSize: isMobile ? '1.25rem' : '1.5rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #05A74E, #6EA297)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #05A74E, #6EA297)',
    color: '#FAFBFD',
    padding: isMobile ? '8px 16px' : '12px 24px',
    borderRadius: '12px',
    border: 'none',
    fontWeight: '600',
    fontSize: isMobile ? '0.75rem' : '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    margin: '0.25rem'
  };

  const secondaryButtonStyle = {
    background: 'rgba(75, 77, 82, 0.3)',
    color: '#FAFBFD',
    padding: isMobile ? '8px 16px' : '12px 24px',
    borderRadius: '12px',
    border: '1px solid rgba(175, 180, 177, 0.2)',
    fontWeight: '600',
    fontSize: isMobile ? '0.75rem' : '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    margin: '0.25rem'
  };

  const heroStyle = {
    textAlign: 'center' as const,
    padding: isMobile ? '4rem 1rem 2rem' : '6rem 2rem 4rem',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const heroTitleStyle = {
    fontSize: isMobile ? '2.5rem' : '4rem',
    fontWeight: '900',
    lineHeight: '1.1',
    marginBottom: '2rem',
    background: 'linear-gradient(135deg, #FAFBFD 0%, #6EA297 50%, #05A74E 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  };

  const modalStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: isMobile ? '1rem' : '2rem'
  };

  const modalContentStyle = {
    background: 'linear-gradient(135deg, #0a0a0b, #1a1a1c)',
    borderRadius: '20px',
    padding: isMobile ? '1.5rem' : '2rem',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    border: '1px solid rgba(5, 167, 78, 0.2)'
  };

  const inputStyle = {
    width: '100%',
    padding: '1rem',
    borderRadius: '12px',
    border: '1px solid rgba(175, 180, 177, 0.3)',
    background: 'rgba(5, 167, 78, 0.05)',
    color: '#FAFBFD',
    fontSize: '1rem',
    marginBottom: '1rem',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const countries = [
    'Brasil', 'Argentina', 'Chile', 'Colômbia', 'Peru', 'Venezuela',
    'México', 'Estados Unidos', 'Canadá', 'Portugal', 'Espanha',
    'França', 'Alemanha', 'Reino Unido', 'Itália', 'Outros'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptTerms) {
      alert('Você precisa aceitar os termos e políticas para continuar');
      return;
    }
    console.log('Dados do formulário:', formData);
    alert('Cadastro realizado com sucesso! Você receberá um email de confirmação.');
    setShowRegisterForm(false);
  };

  return (
    <>
      <Head>
        <title>Programa de Afiliados - CoinBitClub MarketBot</title>
        <meta name="description" content="Ganhe até 50% de comissão divulgando o melhor bot de trading com IA do mercado" />
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <div style={logoStyle}>⚡ CoinBitClub Afiliados</div>
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '1rem',
            alignItems: 'center',
            flexWrap: 'wrap' as const
          }}>
            <button 
              style={secondaryButtonStyle}
              onClick={() => setShowLoginForm(true)}
            >
              Login
            </button>
            <button 
              style={buttonStyle}
              onClick={() => setShowRegisterForm(true)}
            >
              Cadastre-se
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section style={heroStyle}>
          <h1 style={heroTitleStyle}>
            Programa de Afiliados<br />
            MarketBot
          </h1>
          <p style={{
            fontSize: isMobile ? '1.125rem' : '1.5rem',
            color: '#AFB4B1',
            marginBottom: '3rem',
            lineHeight: '1.6'
          }}>
            Ganhe até <strong style={{color: '#05A74E'}}>50% de comissão</strong> divulgando o melhor bot de trading com IA do mercado
          </p>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap' as const,
            marginBottom: '2rem'
          }}>
            <button 
              style={{
                ...buttonStyle,
                fontSize: isMobile ? '1rem' : '1.125rem',
                padding: isMobile ? '1rem 2rem' : '1.25rem 3rem'
              }}
              onClick={() => setShowRegisterForm(true)}
            >
              🚀 Quero Ser Afiliado
            </button>
            <button 
              style={{
                ...secondaryButtonStyle,
                fontSize: isMobile ? '1rem' : '1.125rem',
                padding: isMobile ? '1rem 2rem' : '1.25rem 3rem'
              }}
              onClick={() => setShowHowItWorks(true)}
            >
              📊 Como Funciona
            </button>
          </div>
        </section>

        {/* Benefits Grid */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          maxWidth: '1000px',
          margin: '4rem auto',
          padding: '0 1rem'
        }}>
          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: isMobile ? '1.5rem' : '2rem',
            textAlign: 'center' as const
          }}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>💰</div>
            <h3 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#05A74E'}}>
              Até 50% Comissão
            </h3>
            <p style={{color: '#AFB4B1', lineHeight: '1.6'}}>
              Receba até 50% de comissão vitalícia sobre todos os pagamentos dos seus indicados
            </p>
          </div>

          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: isMobile ? '1.5rem' : '2rem',
            textAlign: 'center' as const
          }}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📈</div>
            <h3 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#05A74E'}}>
              Produto de Alta Conversão
            </h3>
            <p style={{color: '#AFB4B1', lineHeight: '1.6'}}>
              MarketBot com 92.8% de accuracy converte muito bem e gera renda recorrente
            </p>
          </div>

          <div style={{
            background: 'rgba(5, 167, 78, 0.05)',
            border: '1px solid rgba(5, 167, 78, 0.2)',
            borderRadius: '20px',
            padding: isMobile ? '1.5rem' : '2rem',
            textAlign: 'center' as const
          }}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🎯</div>
            <h3 style={{fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#05A74E'}}>
              Material de Apoio
            </h3>
            <p style={{color: '#AFB4B1', lineHeight: '1.6'}}>
              Receba banners, vídeos, textos e todo material necessário para divulgar
            </p>
          </div>
        </section>

        {/* How It Works Modal */}
        {showHowItWorks && (
          <div style={modalStyle} onClick={() => setShowHowItWorks(false)}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: '700', color: '#05A74E'}}>
                  Como Funciona o Programa
                </h2>
                <button 
                  onClick={() => setShowHowItWorks(false)}
                  style={{background: 'none', border: 'none', color: '#AFB4B1', fontSize: '1.5rem', cursor: 'pointer'}}
                >
                  ✕
                </button>
              </div>

              <div style={{marginBottom: '1.5rem'}}>
                <h3 style={{color: '#05A74E', marginBottom: '0.5rem'}}>1. Cadastre-se Grátis</h3>
                <p style={{color: '#AFB4B1', lineHeight: '1.6'}}>
                  Faça seu cadastro no programa de afiliados e receba seu link único
                </p>
              </div>

              <div style={{marginBottom: '1.5rem'}}>
                <h3 style={{color: '#05A74E', marginBottom: '0.5rem'}}>2. Divulgue seu Link</h3>
                <p style={{color: '#AFB4B1', lineHeight: '1.6'}}>
                  Compartilhe em redes sociais, WhatsApp, Telegram ou onde quiser
                </p>
              </div>

              <div style={{marginBottom: '1.5rem'}}>
                <h3 style={{color: '#05A74E', marginBottom: '0.5rem'}}>3. Ganhe Comissões</h3>
                <p style={{color: '#AFB4B1', lineHeight: '1.6'}}>
                  Receba até 50% de comissão vitalícia sobre todos os pagamentos
                </p>
              </div>

              <div style={{marginBottom: '2rem'}}>
                <h3 style={{color: '#05A74E', marginBottom: '0.5rem'}}>4. Acompanhe Resultados</h3>
                <p style={{color: '#AFB4B1', lineHeight: '1.6'}}>
                  Dashboard completo para acompanhar clicks, conversões e ganhos
                </p>
              </div>

              <button 
                style={{...buttonStyle, width: '100%', padding: '1rem'}}
                onClick={() => {
                  setShowHowItWorks(false);
                  setShowRegisterForm(true);
                }}
              >
                Quero Me Cadastrar Agora
              </button>
            </div>
          </div>
        )}

        {/* Register Form Modal */}
        {showRegisterForm && (
          <div style={modalStyle} onClick={() => setShowRegisterForm(false)}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: '700', color: '#05A74E'}}>
                  Cadastro de Afiliado
                </h2>
                <button 
                  onClick={() => setShowRegisterForm(false)}
                  style={{background: 'none', border: 'none', color: '#AFB4B1', fontSize: '1.5rem', cursor: 'pointer'}}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Nome Completo *"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  style={inputStyle}
                  required
                / />

                <input
                  type="email"
                  name="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={inputStyle}
                  required
                / />

                <input
                  type="tel"
                  name="whatsapp"
                  placeholder="WhatsApp (com código do país) *"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  style={inputStyle}
                  required
                / />

                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  style={selectStyle}
                  required
                >
                  <option value="">Selecione seu País *</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.4'
                }}>
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    style={{marginTop: '0.25rem'}}
                    required
                  / />
                  <label style={{color: '#AFB4B1'}}>
                    Eu aceito os <a href="#" style={{color: '#05A74E', textDecoration: 'underline'}}>Termos de Uso</a> e 
                    a <a href="#" style={{color: '#05A74E', textDecoration: 'underline'}}>Política de Privacidade</a> *
                  </label>
                </div>

                <button 
                  type="submit"
                  style={{...buttonStyle, width: '100%', padding: '1rem', fontSize: '1rem'}}
                >
                  🚀 Cadastrar como Afiliado
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Login Form Modal */}
        {showLoginForm && (
          <div style={modalStyle} onClick={() => setShowLoginForm(false)}>
            <div style={{...modalContentStyle, maxWidth: '400px'}} onClick={(e) => e.stopPropagation()}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                <h2 style={{fontSize: '1.5rem', fontWeight: '700', color: '#05A74E'}}>
                  Login Afiliado
                </h2>
                <button 
                  onClick={() => setShowLoginForm(false)}
                  style={{background: 'none', border: 'none', color: '#AFB4B1', fontSize: '1.5rem', cursor: 'pointer'}}
                >
                  ✕
                </button>
              </div>

              <form>
                <input
                  type="email"
                  placeholder="Email"
                  style={inputStyle}
                  required
                / />

                <input
                  type="password"
                  placeholder="Senha"
                  style={inputStyle}
                  required
                / />

                <button 
                  type="submit"
                  style={{...buttonStyle, width: '100%', padding: '1rem', fontSize: '1rem', marginBottom: '1rem'}}
                >
                  Entrar
                </button>

                <div style={{textAlign: 'center' as const}}>
                  <a href="#" style={{color: '#05A74E', fontSize: '0.875rem', textDecoration: 'underline'}}>
                    Esqueci minha senha
                  </a>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid rgba(175, 180, 177, 0.1)',
          padding: '3rem 1rem',
          textAlign: 'center' as const,
          color: '#AFB4B1'
        }}>
          <div style={logoStyle}>⚡ CoinBitClub</div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginTop: '1rem',
            flexWrap: 'wrap' as const,
            fontSize: '0.875rem'
          }}>
            <a href="#" style={{color: '#05A74E', textDecoration: 'underline'}}>Termos de Uso</a>
            <a href="#" style={{color: '#05A74E', textDecoration: 'underline'}}>Política de Privacidade</a>
            <a href="#" style={{color: '#05A74E', textDecoration: 'underline'}}>Suporte</a>
          </div>
          <p style={{marginTop: '1rem', fontSize: '0.875rem'}}>
            © 2025 CoinBitClub. Programa de Afiliados MarketBot. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </>
  );
};

export default AffiliateSimple;
