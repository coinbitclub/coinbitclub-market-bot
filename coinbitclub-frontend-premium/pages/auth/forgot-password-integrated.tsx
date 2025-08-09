import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiPhone, FiArrowLeft, FiCheck, FiLoader, FiAlertCircle, FiKey, FiEye, FiEyeOff } from 'react-icons/fi';

const ForgotPasswordIntegratedPage: NextPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Telefone, 2: Código, 3: Nova Senha
  const [formData, setFormData] = useState({
    phone: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Enviar código de verificação via SMS
  const sendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!formData.phone) {
      setError('Número de telefone é obrigatório');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formData.phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2);
        setMessage('Código de verificação enviado via SMS!');
      } else {
        setError(data.message || 'Erro ao enviar código de verificação');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Verificar código do SMS
  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.verificationCode) {
      setError('Código de verificação é obrigatório');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-recovery-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: formData.phone,
          code: formData.verificationCode 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(3);
        setMessage('Código verificado! Agora defina sua nova senha.');
      } else {
        setError(data.message || 'Código de verificação inválido');
      }
    } catch (error) {
      console.error('Verify code error:', error);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Redefinir senha
  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Todos os campos são obrigatórios');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: formData.phone,
          code: formData.verificationCode,
          newPassword: formData.newPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Senha redefinida com sucesso! Redirecionando para o login...');
        setTimeout(() => {
          router.push('/auth/login-integrated');
        }, 2000);
      } else {
        setError(data.message || 'Erro ao redefinir senha');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Recuperar Senha | CoinBitClub</title>
        <meta name="description" content="Recupere sua senha usando verificação via SMS" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          padding: '3rem',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.05)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #F59E0B, #EAB308)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '2.5rem',
              fontWeight: '800',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em'
            }}>
              ⚡ CoinBitClub
            </div>
            <h1 style={{
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: '0 0 0.5rem 0'
            }}>
              {step === 1 && 'Recuperar Senha'}
              {step === 2 && 'Verificar Código'}
              {step === 3 && 'Nova Senha'}
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1rem',
              margin: 0
            }}>
              {step === 1 && 'Digite seu telefone para receber o código SMS'}
              {step === 2 && 'Digite o código enviado para o seu telefone'}
              {step === 3 && 'Defina sua nova senha de acesso'}
            </p>
          </div>

          {/* Voltar */}
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'none',
                border: 'none',
                color: '#F59E0B',
                fontSize: '0.9rem',
                cursor: 'pointer',
                marginBottom: '1rem',
                padding: '0.5rem',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
              <FiArrowLeft />
              Voltar
            </button>
          )}

          {/* Messages */}
          {error && (
            <div style={{
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <FiAlertCircle style={{ color: '#F87171', fontSize: '1.2rem' }} />
              <span style={{ color: '#F87171', fontSize: '0.9rem' }}>{error}</span>
            </div>
          )}

          {message && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <FiCheck style={{ color: '#22C55E', fontSize: '1.2rem' }} />
              <span style={{ color: '#22C55E', fontSize: '0.9rem' }}>{message}</span>
            </div>
          )}

          {/* Step 1: Telefone */}
          {step === 1 && (
            <form onSubmit={sendVerificationCode}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#B0B3B8',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Número do Telefone
                </label>
                <div style={{ position: 'relative' }}>
                  <FiPhone style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '1rem'
                  }} />
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '1rem 1rem 1rem 3rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: loading ? 'rgba(245, 158, 11, 0.5)' : 'linear-gradient(135deg, #F59E0B, #EAB308)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#000',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  marginBottom: '1.5rem'
                }}
              >
                {loading ? <FiLoader style={{ animation: 'spin 1s linear infinite' }} /> : <FiPhone />}
                {loading ? 'Enviando...' : 'Enviar Código SMS'}
              </button>
            </form>
          )}

          {/* Step 2: Código */}
          {step === 2 && (
            <form onSubmit={verifyCode}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#B0B3B8',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Código de Verificação
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={formData.verificationCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, verificationCode: e.target.value }))}
                  maxLength={6}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1.5rem',
                    textAlign: 'center',
                    letterSpacing: '0.5rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: loading ? 'rgba(245, 158, 11, 0.5)' : 'linear-gradient(135deg, #F59E0B, #EAB308)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#000',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  marginBottom: '1.5rem'
                }}
              >
                {loading ? <FiLoader style={{ animation: 'spin 1s linear infinite' }} /> : <FiCheck />}
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>
            </form>
          )}

          {/* Step 3: Nova Senha */}
          {step === 3 && (
            <form onSubmit={resetPassword}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#B0B3B8',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Nova Senha
                </label>
                <div style={{ position: 'relative' }}>
                  <FiKey style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '1rem'
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '1rem 3rem 1rem 3rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.4)',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#B0B3B8',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                }}>
                  Confirmar Nova Senha
                </label>
                <div style={{ position: 'relative' }}>
                  <FiKey style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '1rem'
                  }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirme sua nova senha"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '1rem 3rem 1rem 3rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.4)',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: loading ? 'rgba(245, 158, 11, 0.5)' : 'linear-gradient(135deg, #F59E0B, #EAB308)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#000',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  marginBottom: '1.5rem'
                }}
              >
                {loading ? <FiLoader style={{ animation: 'spin 1s linear infinite' }} /> : <FiKey />}
                {loading ? 'Redefinindo...' : 'Redefinir Senha'}
              </button>
            </form>
          )}

          {/* Links */}
          <div style={{ textAlign: 'center' }}>
            <Link href="/auth/login-integrated" style={{
              color: '#F59E0B',
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}>
              ← Voltar ao Login
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default ForgotPasswordIntegratedPage;
