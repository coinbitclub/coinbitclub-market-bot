// API para recuperação de senha via WhatsApp
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { whatsapp } = req.body;

    if (!whatsapp) {
      return res.status(400).json({ message: 'WhatsApp é obrigatório' });
    }

    // Limpar e validar formato do WhatsApp
    const cleanWhatsApp = whatsapp.replace(/\D/g, '');
    
    if (cleanWhatsApp.length < 10 || cleanWhatsApp.length > 15) {
      return res.status(400).json({ message: 'Formato de WhatsApp inválido' });
    }

    // TODO: Verificar se existe usuário com esse WhatsApp no banco de dados
    // if (!userExists) {
    //   return res.status(404).json({ message: 'Usuário não encontrado com este WhatsApp' });
    // }

    // Gerar código de 6 dígitos para recuperação
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // TODO: Em produção:
    // 1. Armazenar código no banco/cache com expiração (5-10 minutos)
    // 2. Enviar via WhatsApp Business API  
    // 3. Não retornar o código na resposta
    // 4. Associar código ao usuário para verificação posterior

    console.log(`🔑 Código recuperação senha para ${whatsapp}: ${verificationCode}`);

    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Em desenvolvimento, retornamos o código para facilitar testes
    const isDevelopment = process.env.NODE_ENV === 'development';

    return res.status(200).json({
      message: 'Código de recuperação enviado via WhatsApp',
      success: true,
      ...(isDevelopment && { 
        verificationCode, // Apenas para desenvolvimento
        debug: {
          whatsapp: cleanWhatsApp,
          timestamp: new Date().toISOString(),
          purpose: 'password_recovery'
        }
      })
    });

  } catch (error) {
    console.error('Erro ao enviar código de recuperação:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
