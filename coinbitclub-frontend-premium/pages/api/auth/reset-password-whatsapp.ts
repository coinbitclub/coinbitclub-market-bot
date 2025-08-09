// API para redefinir senha via WhatsApp
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { whatsapp, newPassword } = req.body;

    if (!whatsapp || !newPassword) {
      return res.status(400).json({ message: 'WhatsApp e nova senha são obrigatórios' });
    }

    // Limpar WhatsApp
    const cleanWhatsApp = whatsapp.replace(/\D/g, '');
    
    // Validar senha
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres' });
    }

    if (newPassword.length > 128) {
      return res.status(400).json({ message: 'Senha muito longa (máximo 128 caracteres)' });
    }

    // TODO: Em produção:
    // 1. Verificar se o usuário foi previamente verificado (código WhatsApp válido)
    // 2. Buscar usuário pelo WhatsApp no banco de dados
    // 3. Hash da nova senha (bcrypt)
    // 4. Atualizar senha no banco de dados
    // 5. Invalidar todas as sessões ativas do usuário
    // 6. Log de segurança da alteração de senha

    // Simular processo de atualização
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`🔐 Senha redefinida via WhatsApp para: ${cleanWhatsApp}`);

    // Em desenvolvimento, simular sucesso
    const isDevelopment = process.env.NODE_ENV === 'development';

    return res.status(200).json({
      message: 'Senha redefinida com sucesso',
      success: true,
      passwordReset: true,
      ...(isDevelopment && {
        debug: {
          whatsapp: cleanWhatsApp,
          passwordLength: newPassword.length,
          timestamp: new Date().toISOString(),
          action: 'password_reset_whatsapp'
        }
      })
    });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
