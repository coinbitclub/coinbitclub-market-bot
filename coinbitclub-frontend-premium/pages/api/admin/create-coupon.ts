import { NextApiRequest, NextApiResponse } from 'next';

interface CreateCouponRequest {
  code: string;
  amount: number;
  currency: string;
  description: string;
  type: 'single_use' | 'multi_use' | 'unlimited';
  usage_limit?: number;
  expires_at?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      code, 
      amount, 
      currency, 
      description, 
      type, 
      usage_limit, 
      expires_at 
    }: CreateCouponRequest = req.body;

    // Validações básicas
    if (!code || !amount || !currency || !description || !type) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: code, amount, currency, description, type' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        message: 'O valor deve ser maior que zero' 
      });
    }

    // Validar código único (em produção, verificar no banco)
    const codeExists = false; // TODO: Verificar no banco de dados
    if (codeExists) {
      return res.status(400).json({ 
        message: 'Código de cupom já existe' 
      });
    }

    // Validar data de expiração
    if (expires_at) {
      const expirationDate = new Date(expires_at);
      if (expirationDate <= new Date()) {
        return res.status(400).json({ 
          message: 'Data de expiração deve ser futura' 
        });
      }
    }

    // Simulação - Em produção, conectar com banco de dados
    const coupon = {
      id: `cpn_${Date.now()}`,
      code: code.toUpperCase(),
      amount: amount,
      currency: currency,
      description: description,
      type: type,
      usage_limit: type === 'unlimited' ? null : (usage_limit || 1),
      usage_count: 0,
      is_active: true,
      is_withdrawable: false, // Cupons nunca geram direito a saque
      expires_at: expires_at || null,
      created_at: new Date().toISOString(),
      created_by: 'admin', // Em produção, pegar do token de autenticação
      updated_at: new Date().toISOString()
    };

    // TODO: Implementar as seguintes operações no banco de dados:
    // 1. Inserir cupom na tabela de cupons
    // 2. Registrar log de criação
    // 3. Gerar código QR para compartilhamento (opcional)
    // 4. Enviar notificação para admins (opcional)

    console.log('Cupom criado:', coupon);

    return res.status(201).json({
      success: true,
      message: 'Cupom criado com sucesso',
      coupon: {
        id: coupon.id,
        code: coupon.code,
        amount: coupon.amount,
        currency: coupon.currency,
        description: coupon.description,
        type: coupon.type,
        usage_limit: coupon.usage_limit,
        expires_at: coupon.expires_at,
        created_at: coupon.created_at
      }
    });

  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor' 
    });
  }
}
