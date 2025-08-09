import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiPhone, FiArrowLeft, FiCheck, FiLoader, FiAlertCircle, FiKey, FiEye, FiEyeOff } from 'react-icons/fi';

const ForgotPasswordPage: NextPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: WhatsApp, 2: Código, 3: Nova Senha
  const [formData, setFormData] = useState({
    whatsapp: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [verification, setVerification] = useState({
    codeSent: false,
    codeVerified: false,
    generatedCode: '',
    loading: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Enviar código de verificação via WhatsApp
  const sendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!formData.whatsapp) {
      setError('WhatsApp é obrigatório');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ whatsapp: formData.whatsapp }),
      });

      const data = await response.json();

      if (response.ok) {
        setVerification(prev => ({
          ...prev,
          codeSent: true,
          generatedCode: data.verificationCode
        }));
        setStep(2);
        setMessage('Código de verificação enviado via WhatsApp!');
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

  // Verificar código do WhatsApp
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
      const response = await fetch('/api/auth/verify-forgot-password-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          whatsapp: formData.whatsapp,
          code: formData.verificationCode 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setVerification(prev => ({ ...prev, codeVerified: true }));
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
      const response = await fetch('/api/auth/reset-password-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          whatsapp: formData.whatsapp,
          newPassword: formData.newPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Senha redefinida com sucesso! Redirecionando para o login...');
        setTimeout(() => {
          router.push('/auth/login');
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
        <title>Recuperar Senha via WhatsApp | CoinBitClub</title>
        <meta name="description" content="Recupere sua senha usando verificação via WhatsApp" />
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
              {step === 1 && 'Digite seu WhatsApp para receber o código de verificação'}
              {step === 2 && 'Digite o código enviado para o seu WhatsApp'}
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

          {/* Step 1: WhatsApp */}
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
                  Número do WhatsApp
                </label>
                <div style={{ position: 'relative' }}>
                  <FiPhone style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#F59E0B',
                    fontSize: '1.1rem'
                  }} />
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="+55 (11) 99999-9999"
                    required
                    style={{
                      width: '100%',
                      padding: '0.875rem 0.875rem 0.875rem 3rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      background: 'rgba(245, 158, 11, 0.05)',
                      color: '#fff',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(245, 158, 11, 0.3)'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: loading ? 'rgba(245, 158, 11, 0.5)' : 'linear-gradient(135deg, #F59E0B, #EAB308)',
                  color: '#000',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? <FiLoader className="animate-spin" /> : <FiPhone />}
                {loading ? 'Enviando Código...' : 'Enviar Código via WhatsApp'}
              </button>
            </form>
          )}

          {/* Step 2: Código de Verificação */}
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
                  value={formData.verificationCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, verificationCode: e.target.value }))}
                  placeholder="Digite o código de 6 dígitos"
                  maxLength={6}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    background: 'rgba(245, 158, 11, 0.05)',
                    color: '#fff',
                    fontSize: '1.2rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    textAlign: 'center',
                    letterSpacing: '3px',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(245, 158, 11, 0.3)'}
                />
                <p style={{
                  fontSize: '0.8rem',
                  color: '#B0B3B8',
                  marginTop: '0.5rem',
                  textAlign: 'center'
                }}>
                  Código enviado para: <strong>{formData.whatsapp}</strong>
                </p>
                {verification.generatedCode && (
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#F59E0B',
                    marginTop: '0.5rem',
                    textAlign: 'center'
                  }}>
                    Código de teste: <strong>{verification.generatedCode}</strong> (apenas para demonstração)
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: loading ? 'rgba(245, 158, 11, 0.5)' : 'linear-gradient(135deg, #F59E0B, #EAB308)',
                  color: '#000',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? <FiLoader className="animate-spin" /> : <FiCheck />}
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>

              <button
                type="button"
                onClick={() => sendVerificationCode(new Event('submit') as any)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  background: 'none',
                  color: '#F59E0B',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginTop: '1rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              >
                Reenviar Código
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
                    color: '#F59E0B',
                    fontSize: '1.1rem'
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Digite sua nova senha"
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '0.875rem 3rem 0.875rem 3rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      background: 'rgba(245, 158, 11, 0.05)',
                      color: '#fff',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(245, 158, 11, 0.3)'}
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
                      color: '#F59E0B',
                      cursor: 'pointer',
                      fontSize: '1.1rem'
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
                    color: '#F59E0B',
                    fontSize: '1.1rem'
                  }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirme sua nova senha"
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '0.875rem 3rem 0.875rem 3rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      background: 'rgba(245, 158, 11, 0.05)',
                      color: '#fff',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(245, 158, 11, 0.3)'}
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
                      color: '#F59E0B',
                      cursor: 'pointer',
                      fontSize: '1.1rem'
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
                  borderRadius: '12px',
                  border: 'none',
                  background: loading ? 'rgba(245, 158, 11, 0.5)' : 'linear-gradient(135deg, #F59E0B, #EAB308)',
                  color: '#000',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? <FiLoader className="animate-spin" /> : <FiCheck />}
                {loading ? 'Redefinindo Senha...' : 'Redefinir Senha'}
              </button>
            </form>
          )}

          {/* Footer */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Link href="/auth/login" style={{
              color: '#F59E0B',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}>
              ← Voltar para o Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
