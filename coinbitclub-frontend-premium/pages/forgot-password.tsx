import React, { useState } from 'react';
import { useRouter } from 'next/router';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('Funcionalidade em desenvolvimento');
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Recuperar Senha</h1>
      <p>Digite seu email para receber instruções de recuperação</p>
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu email"
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none' }}
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      
      {message && <p style={{ marginTop: '20px', color: 'blue' }}>{message}</p>}
      
      <div style={{ marginTop: '20px' }}>
        <a href="/auth/login" style={{ color: '#007bff' }}>Voltar ao Login</a>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;