// API para verificar código de recuperação de senha
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { whatsapp, code } = req.body;

    if (!whatsapp || !code) {
      return res.status(400).json({ message: 'WhatsApp e código são obrigatórios' });
    }

    // Limpar WhatsApp
    const cleanWhatsApp = whatsapp.replace(/\D/g, '');
    
    // Validar código (6 dígitos)
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: 'Código deve ter 6 dígitos' });
    }

    // TODO: Em produção:
    // 1. Verificar código armazenado no banco/cache
    // 2. Verificar se código não expirou (5-10 minutos)
    // 3. Verificar se código pertence ao usuário correto
    // 4. Marcar código como usado (não pode ser reutilizado)

    // Para desenvolvimento, aceitar códigos de teste
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isValidCode = isDevelopment && (
      code.startsWith('1') || // Códigos de teste começam com 1
      code === '123456' ||    // Código fixo para testes
      code === '111111'       // Código admin
    );

    if (!isValidCode && !isDevelopment) {
      // Em produção, verificar contra o banco de dados
      return res.status(400).json({ message: 'Código de verificação inválido ou expirado' });
    }

    // Simular delay de verificação
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`✅ Código recuperação verificado para ${cleanWhatsApp}: ${code}`);

    return res.status(200).json({
      message: 'Código verificado com sucesso',
      success: true,
      codeVerified: true,
      canResetPassword: true,
      ...(isDevelopment && {
        debug: {
          whatsapp: cleanWhatsApp,
          code,
          timestamp: new Date().toISOString(),
          purpose: 'password_recovery_verification'
        }
      })
    });

  } catch (error) {
    console.error('Erro ao verificar código de recuperação:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
