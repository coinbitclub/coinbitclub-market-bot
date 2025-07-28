// Endpoint de teste para verificar se a API está funcionando
export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      message: '🎉 API funcionando perfeitamente!',
      timestamp: new Date().toISOString(),
      status: 'ok',
      frontend: 'Next.js',
      version: '1.0.0'
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
