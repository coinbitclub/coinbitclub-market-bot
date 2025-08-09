import { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:9997';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token é obrigatório' });
    }

    // Validar token no backend
    const backendResponse = await fetch(`${BACKEND_URL}/auth/validate-reset-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!backendResponse.ok) {
      return res.status(400).json({ 
        error: 'Token inválido ou expirado',
        valid: false,
      });
    }

    // Token válido
    res.status(200).json({
      message: 'Token válido',
      valid: true,
    });

  } catch (error) {
    console.error('Erro na API validar-token:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      valid: false,
    });
  }
}
