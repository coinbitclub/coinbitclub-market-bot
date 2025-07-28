import { useState } from 'react';

const SimpleTest = () => {
  const [message, setMessage] = useState('Página carregada!');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🧪 Teste Simples - CoinBitClub</h1>
      <p>{message}</p>
      <button 
        onClick={() => setMessage('Botão funcionando!')}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Testar
      </button>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
        <h3>Status do Sistema:</h3>
        <p>✅ Frontend Next.js rodando</p>
        <p>✅ React funcionando</p>
        <p>✅ JavaScript ativo</p>
        <p>✅ CSS carregado</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <a 
          href="/integration-test" 
          style={{
            display: 'inline-block',
            backgroundColor: '#28a745',
            color: 'white',
            padding: '10px 20px',
            textDecoration: 'none',
            borderRadius: '5px'
          }}
        >
          Ir para Teste de Integração
        </a>
      </div>
    </div>
  );
};

export default SimpleTest;
