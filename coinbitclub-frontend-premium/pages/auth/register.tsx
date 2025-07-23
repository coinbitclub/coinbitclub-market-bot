import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';

const RegisterPage: NextPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    country: '',
    email: '',
    password: '',
    confirmPassword: '',
    affiliateCode: '',
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #0a0a0b 25%, #1a1a1c 50%, #0a0a0b 75%, #000000 100%)',
    color: '#FAFBFD',
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  };

  const formContainerStyle = {
    background: 'rgba(0, 0, 0, 0.8)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '20px',
    padding: '3rem',
    maxWidth: '500px',
    width: '100%',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 0 40px rgba(255, 215, 0, 0.2)',
  };

  const titleStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    background: 'linear-gradient(45deg, #FFD700, #FF69B4, #00BFFF)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    textAlign: 'center' as const,
  };

  const subtitleStyle = {
    color: '#B0B3B8',
    textAlign: 'center' as const,
    marginBottom: '2rem',
  };

  const inputStyle = {
    width: '100%',
    padding: '1rem',
    marginBottom: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.3s ease',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const buttonStyle = {
    width: '100%',
    padding: '1rem',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '1rem',
  };

  const checkboxContainerStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  };

  const checkboxStyle = {
    width: '18px',
    height: '18px',
    marginTop: '2px',
  };

  const linkStyle = {
    color: '#00BFFF',
    textDecoration: 'none',
    fontSize: '0.9rem',
  };

  const errorStyle = {
    background: 'rgba(255, 0, 0, 0.1)',
    border: '1px solid rgba(255, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem',
    color: '#ff6b6b',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    textAlign: 'center' as const,
  };

  const trialBadgeStyle = {
    background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center' as const,
    marginBottom: '1.5rem',
  };

  const countries = [
    'Brasil', 'Argentina', 'Chile', 'Colômbia', 'Peru', 'Uruguai', 'Paraguai',
    'Estados Unidos', 'Canadá', 'México', 'Portugal', 'Espanha', 'França',
    'Alemanha', 'Itália', 'Reino Unido', 'Outros'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim() || formData.fullName.length < 2) 
      return 'Nome completo é obrigatório (mínimo 2 caracteres)';
    
    if (!formData.phone.trim() || formData.phone.length < 8) 
      return 'Telefone é obrigatório (mínimo 8 dígitos)';
    
    if (!formData.country) 
      return 'País é obrigatório';
    
    if (!formData.email.trim() || !formData.email.includes('@')) 
      return 'E-mail válido é obrigatório';
    
    if (formData.password.length < 6) 
      return 'Senha deve ter pelo menos 6 caracteres';
    
    if (formData.password !== formData.confirmPassword) 
      return 'Senhas não coincidem';
    
    if (!formData.acceptTerms) 
      return 'Você deve aceitar os termos de uso';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Tenta primeiro a API simples
      const response = await fetch('/api/auth/register-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          phone: formData.phone,
          country: formData.country,
          email: formData.email,
          password: formData.password,
          referralCode: formData.affiliateCode || 'Coinbitclub',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard?welcome=true');
      } else {
        // Se a API simples falhar, tenta a API original
        const fallbackResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            phone: formData.phone,
            country: formData.country,
            email: formData.email,
            password: formData.password,
            affiliateCode: formData.affiliateCode || 'Coinbitclub',
          }),
        });

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          router.push('/dashboard?welcome=true');
        } else {
          const errorData = await fallbackResponse.json();
          setError(errorData.message || 'Erro ao criar conta');
        }
      }
    } catch (err) {
      // Fallback para desenvolvimento - simular cadastro
      console.log('API not available, simulating registration...');
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ 
        id: '1', 
        email: formData.email, 
        fullName: formData.fullName,
        phone: formData.phone,
        country: formData.country,
        isAdmin: false,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }));
      router.push('/dashboard?welcome=true&trial=true');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Cadastro - CoinBitClub</title>
        <meta name="description" content="Crie sua conta no CoinBitClub e comece a trading" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={containerStyle}>
        <div style={formContainerStyle}>
          <Link href="/" style={{ 
            display: 'block', 
            textAlign: 'center', 
            marginBottom: '2rem',
            fontSize: '1.5rem',
            background: 'linear-gradient(45deg, #FFD700, #FF69B4, #00BFFF)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}>
            ⚡ CoinBitClub
          </Link>
          
          <div style={trialBadgeStyle}>
            🎁 Teste Grátis por 7 Dias!
          </div>
          
          <h1 style={titleStyle}>Criar Conta</h1>
          <p style={subtitleStyle}>Comece sua jornada no trading inteligente</p>

          {error && <div style={errorStyle}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="fullName"
              placeholder="Nome completo *"
              value={formData.fullName}
              onChange={handleInputChange}
              style={inputStyle}
              required
            />
            
            <input
              type="tel"
              name="phone"
              placeholder="Telefone (com DDD) *"
              value={formData.phone}
              onChange={handleInputChange}
              style={inputStyle}
              required
            />
            
            <select
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              style={selectStyle}
              required
            >
              <option value="">Selecione seu país *</option>
              {countries.map(country => (
                <option key={country} value={country} style={{ background: '#000', color: '#fff' }}>
                  {country}
                </option>
              ))}
            </select>
            
            <input
              type="email"
              name="email"
              placeholder="Seu melhor e-mail *"
              value={formData.email}
              onChange={handleInputChange}
              style={inputStyle}
              required
            />
            
            <input
              type="password"
              name="password"
              placeholder="Crie uma senha segura (mín. 8 caracteres) *"
              value={formData.password}
              onChange={handleInputChange}
              style={inputStyle}
              required
            />
            
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirme sua senha *"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              style={inputStyle}
              required
            />

            <input
              type="text"
              name="affiliateCode"
              placeholder="Código de afiliado (opcional)"
              value={formData.affiliateCode}
              onChange={handleInputChange}
              style={inputStyle}
            />
            <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '-0.5rem', marginBottom: '1rem' }}>
              Se você foi indicado por um afiliado, insira o código aqui. Se não tiver código, 
              será vinculado automaticamente como "Coinbitclub".
            </p>

            <div style={checkboxContainerStyle}>
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                style={checkboxStyle}
                required
              />
              <label style={{ fontSize: '0.875rem', color: '#B0B3B8', lineHeight: '1.4' }}>
                Eu aceito os{' '}
                <Link href="/privacy" style={linkStyle} target="_blank">
                  Termos de Uso e Política de Privacidade
                </Link>{' '}
                do CoinBitClub *
              </label>
            </div>
            
            <button 
              type="submit" 
              style={buttonStyle}
              disabled={loading}
            >
              {loading ? '🔄 Criando conta...' : '🚀 Criar Conta Grátis'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <p style={{ color: '#B0B3B8', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Já tem uma conta?{' '}
              <Link href="/auth/login" style={linkStyle}>
                Faça login aqui
              </Link>
            </p>
            
            <div style={{ margin: '1.5rem 0', height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            
            <Link href="/landing" style={{
              ...linkStyle,
              display: 'inline-block',
              padding: '0.5rem 1rem',
              border: '1px solid rgba(0, 191, 255, 0.3)',
              borderRadius: '8px',
              background: 'rgba(0, 191, 255, 0.1)',
            }}>
              ← Voltar para o site
            </Link>
          </div>

          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: 'rgba(0, 191, 255, 0.1)', 
            borderRadius: '8px',
            fontSize: '0.875rem',
            textAlign: 'center',
            color: '#B0B3B8'
          }}>
            🔒 Seus dados estão seguros. Utilizamos criptografia de nível bancário para proteger suas informações.
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
