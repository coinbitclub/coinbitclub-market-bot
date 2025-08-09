// API para verificar código WhatsApp no cadastro
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

    // TODO: Em produção, verificar código armazenado no banco/cache
    // Verificar se código não expirou (5-10 minutos)
    // Remover código após verificação bem-sucedida

    // Para desenvolvimento, aceitar qualquer código que comece com '1' ou códigos de teste
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

    console.log(`✅ Código WhatsApp verificado para ${cleanWhatsApp}: ${code}`);

    return res.status(200).json({
      message: 'Código verificado com sucesso',
      success: true,
      whatsappVerified: true,
      ...(isDevelopment && {
        debug: {
          whatsapp: cleanWhatsApp,
          code,
          timestamp: new Date().toISOString(),
          method: 'development_bypass'
        }
      })
    });

  } catch (error) {
    console.error('Erro ao verificar código WhatsApp:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
