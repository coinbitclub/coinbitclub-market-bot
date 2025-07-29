export default function handler(req, res) {
  // Simulação de verificação de servidor
  const serverStatus = {
    status: 'online',
    message: 'API está funcionando corretamente',
    timestamp: new Date().toISOString(),
    endpoints: [
      { name: 'Autenticação', path: '/api/auth', status: 'online' },
      { name: 'Dados do Usuário', path: '/api/user', status: 'online' },
      { name: 'Transações', path: '/api/transactions', status: 'online' },
      { name: 'Sinais de Trading', path: '/api/signals', status: 'online' }
    ]
  };

  res.status(200).json(serverStatus);
}
