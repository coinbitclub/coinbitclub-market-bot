import { NextApiRequest, NextApiResponse } from 'next';'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:9997';'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {'
    return res.status(405).json({ error: 'Método não permitido' });'
  }

  try {
    const { token, novaSenha, confirmarSenha } = req.body;

    // Validações
    if (!token) {
      return res.status(400).json({ error: 'Token é obrigatório' });'
    }

    if (!novaSenha) {
      return res.status(400).json({ error: 'Nova senha é obrigatória' });'
    }

    if (!confirmarSenha) {
      return res.status(400).json({ error: 'Confirmação de senha é obrigatória' });'
    }

    if (novaSenha !== confirmarSenha) {
      return res.status(400).json({ error: 'As senhas não coincidem' });'
    }

    // Validar força da senha
    const validarSenha = (senha: string) => {
      return {
        tamanho: senha.length >= 8,
        maiuscula: /[A-Z]/.test(senha),
        minuscula: /[a-z]/.test(senha),
        numero: /\d/.test(senha),
        especial: /[!@#$%^&*(),.?":{}|<>]/.test(senha),"
      };
    };

    const requisitos = validarSenha(novaSenha);
    const senhaValida = Object.values(requisitos).every(Boolean);

    if (!senhaValida) {
      return res.status(400).json({ 
        error: 'A senha não atende aos requisitos de segurança','
        requisitos,
      });
    }

    // Enviar para o backend
    const backendResponse = await fetch(`${BACKEND_URL}/auth/reset-password`, {
      method: 'POST','
      headers: {
        'Content-Type': 'application/json','
      },
      body: JSON.stringify({
        token,
        newPassword: novaSenha,
        confirmPassword: confirmarSenha,
      }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return res.status(backendResponse.status).json(data);
    }

    // Retornar sucesso
    res.status(200).json({
      message: 'Senha redefinida com sucesso','
      success: true,
    });

  } catch (error) {
    console.error('Erro na API redefinir-senha:', error);'
    res.status(500).json({ 
      error: 'Erro interno do servidor','
      message: 'Tente novamente mais tarde' '
    });
  }
}
