import { NextApiRequest, NextApiResponse } from 'next';

interface ValidateCouponRequest {
  code: string;
  userId?: string; // Para uso do cupom
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  if (method === 'POST') {
    // Validar cupom
    try {
      const { code }: ValidateCouponRequest = req.body;

      if (!code) {
        return res.status(400).json({ message: 'Código do cupom é obrigatório' });
      }

      // TODO: Buscar cupom no banco de dados
      // Simulação de cupom encontrado
      const coupon = {
        id: 'cpn_1234567890',
        code: code.toUpperCase(),
        amount: 50.00,
        currency: 'USD',
        description: 'Bônus de boas-vindas',
        type: 'single_use',
        usage_limit: 1,
        usage_count: 0,
        is_active: true,
        expires_at: null,
        created_at: new Date().toISOString()
      };

      // Validações
      if (!coupon.is_active) {
        return res.status(400).json({ 
          message: 'Cupom inativo',
          valid: false 
        });
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return res.status(400).json({ 
          message: 'Cupom expirado',
          valid: false 
        });
      }

      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        return res.status(400).json({ 
          message: 'Cupom esgotado',
          valid: false 
        });
      }

      return res.status(200).json({
        valid: true,
        coupon: {
          code: coupon.code,
          amount: coupon.amount,
          currency: coupon.currency,
          description: coupon.description,
          type: coupon.type
        }
      });

    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  if (method === 'PUT') {
    // Usar cupom
    try {
      const { code, userId }: ValidateCouponRequest = req.body;

      if (!code || !userId) {
        return res.status(400).json({ 
          message: 'Código do cupom e ID do usuário são obrigatórios' 
        });
      }

      // TODO: Implementar lógica de uso do cupom
      // 1. Verificar se cupom é válido
      // 2. Verificar se usuário já usou este cupom (se single_use)
      // 3. Adicionar crédito na conta do usuário
      // 4. Incrementar usage_count do cupom
      // 5. Registrar transação como não-sacável

      const usage = {
        id: `usage_${Date.now()}`,
        coupon_code: code.toUpperCase(),
        user_id: userId,
        amount: 50.00,
        currency: 'USD',
        is_withdrawable: false, // Cupons nunca geram direito a saque
        used_at: new Date().toISOString()
      };

      console.log('Cupom usado:', usage);

      return res.status(200).json({
        success: true,
        message: 'Cupom aplicado com sucesso',
        credit_added: usage.amount,
        currency: usage.currency,
        is_withdrawable: usage.is_withdrawable
      });

    } catch (error) {
      console.error('Erro ao usar cupom:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
