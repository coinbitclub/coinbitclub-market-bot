import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!email) {
      setError('Email é obrigatório');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Email inválido');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        setMessage('Link de recuperação enviado para seu email!');
      } else {
        setError(data.message || 'Erro ao enviar email de recuperação');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Recuperar Senha - CoinBitClub</title>
        <meta name="description" content="Recuperar senha do CoinBitClub" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #2d3748 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#1a202c',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1px solid #2d3748',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '30px' }}>
            <img 
              src="/logo-nova.jpg" 
              alt="CoinBitClub" 
              style={{
                width: '120px',
                height: 'auto',
                borderRadius: '10px'
              }}
            />
          </div>

          <h1 style={{
            color: '#ffa500',
            marginBottom: '10px',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            Recuperar Senha
          </h1>

          <p style={{
            color: '#a0a0a0',
            marginBottom: '30px',
            fontSize: '14px'
          }}>
            Digite seu email para receber o link de recuperação
          </p>

          {!emailSent ? (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <label style={{
                  display: 'block',
                  color: '#e2e8f0',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '5px',
                    border: '1px solid #4a5568',
                    backgroundColor: '#2d3748',
                    color: '#e2e8f0',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              {error && (
                <div style={{
                  backgroundColor: '#fed7d7',
                  color: '#c53030',
                  padding: '10px',
                  borderRadius: '5px',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              {message && (
                <div style={{
                  backgroundColor: '#c6f6d5',
                  color: '#2f855a',
                  padding: '10px',
                  borderRadius: '5px',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: loading ? '#4a5568' : '#ffa500',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </button>
            </form>
          ) : (
            <div>
              <div style={{
                backgroundColor: '#c6f6d5',
                color: '#2f855a',
                padding: '15px',
                borderRadius: '5px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                ✅ {message}
              </div>
              
              <p style={{
                color: '#a0a0a0',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                Verifique sua caixa de entrada e spam. O link expira em 24 horas.
              </p>
            </div>
          )}

          <div style={{ marginTop: '30px' }}>
            <button
              onClick={() => router.push('/auth/login')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                color: '#ffa500',
                border: '1px solid #ffa500',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Voltar ao Login
            </button>
          </div>

          <div style={{ 
            marginTop: '30px', 
            padding: '15px', 
            backgroundColor: '#16213e', 
            borderRadius: '5px',
            border: '1px solid #1e3a2e'
          }}>
            <h4 style={{ color: '#4ade80', margin: '0 0 10px', fontSize: '14px' }}>
              🔒 Recuperação Segura
            </h4>
            <p style={{ color: '#a0a0a0', margin: 0, fontSize: '12px' }}>
              ✅ Link temporário (24h)<br/>
              ✅ Verificação por email<br/>
              ✅ Criptografia SSL/TLS
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
