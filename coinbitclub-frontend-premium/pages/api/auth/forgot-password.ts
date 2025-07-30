import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email é obrigatório' });
  }

  try {
    console.log('📧 Solicitação de recuperação de senha para:', email);

    // Verificar se o usuário existe
    const result = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ Email não encontrado:', email);
      // Por segurança, retornamos sucesso mesmo se o email não existir
      return res.status(200).json({ 
        success: true, 
        message: 'Se o email existir em nossa base, você receberá instruções de recuperação' 
      });
    }

    const user = result.rows[0];
    console.log('✅ Usuário encontrado:', user.email);

    // Gerar token de recuperação
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    
    // Definir expiração (24 horas)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      // Criar tabela se não existir
      await pool.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          used BOOLEAN DEFAULT FALSE,
          UNIQUE(user_id)
        )
      `);

      // Salvar token de recuperação no banco
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at, used) 
         VALUES ($1, $2, $3, NOW(), FALSE)
         ON CONFLICT (user_id) 
         DO UPDATE SET token = $2, expires_at = $3, created_at = NOW(), used = FALSE`,
        [user.id, resetToken, expiresAt]
      );

      console.log('🔑 Token de recuperação gerado e salvo');

      // Em um ambiente real, você enviaria um email aqui
      // Por agora, vamos apenas simular o envio
      console.log('📤 Simulando envio de email de recuperação...');
      console.log('🔗 Link de recuperação:', `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/reset-password?token=${resetToken}`);

      // Simular delay de envio de email
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (dbError) {
      console.error('❌ Erro de banco de dados:', dbError);
      // Continuar mesmo com erro de banco, por segurança
    }

    res.status(200).json({ 
      success: true, 
      message: 'Instruções de recuperação enviadas por email',
      // Em desenvolvimento, incluir o token para facilitar testes
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error) {
    console.error('❌ Erro ao processar recuperação de senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
