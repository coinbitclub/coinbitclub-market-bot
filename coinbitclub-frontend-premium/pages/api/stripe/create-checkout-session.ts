import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Use chave de teste para desenvolvimento
const STRIPE_TEST_KEY = 'sk_test_51234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || STRIPE_TEST_KEY, {
  apiVersion: '2025-06-30.basil',
});

interface PlanConfig {
  name: string;
  description: string;
  price: number; // in cents
  currency: 'brl' | 'usd';
  interval: 'month';
  trialDays: number;
}

const planConfigs: Record<string, PlanConfig> = {
  'brasil-flex': {
    name: 'Brasil FLEX',
    description: 'Bot MARKETBOT básico para iniciantes - 20% comissão (sem mensalidade)',
    price: 0, // sem mensalidade, apenas comissão
    currency: 'brl',
    interval: 'month',
    trialDays: 7
  },
  'brasil-pro': {
    name: 'Brasil PRO',
    description: 'Bot MARKETBOT completo - R$297/mês + 10% comissão',
    price: 29700, // R$ 297.00 in cents
    currency: 'brl',
    interval: 'month',
    trialDays: 7
  },
  'global-flex': {
    name: 'Global FLEX',
    description: 'Trading global básico - 20% comissão (sem mensalidade)',
    price: 0, // sem mensalidade, apenas comissão
    currency: 'usd',
    interval: 'month',
    trialDays: 7
  },
  'global-pro': {
    name: 'Global PRO',
    description: 'Trading global completo - USD 60/mês + 10% comissão',
    price: 6000, // USD 60.00 in cents
    currency: 'usd',
    interval: 'month',
    trialDays: 7
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { planId, userId = 'guest', userEmail = 'guest@coinbitclub.vip' } = req.body;

    if (!planId) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required field: planId' 
      });
    }

    const planConfig = planConfigs[planId];
    if (!planConfig) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid plan ID' 
      });
    }

    // Verificar se temos uma chave do Stripe válida
    const hasValidStripeKey = process.env.STRIPE_SECRET_KEY && 
                             process.env.STRIPE_SECRET_KEY.startsWith('sk_') && 
                             process.env.STRIPE_SECRET_KEY.length > 20;

    if (!hasValidStripeKey) {
      // Modo de desenvolvimento/demonstração - simular sucesso
      console.log('🚀 Modo DEMO: Simulando checkout do Stripe');
      console.log('Plano:', planConfig.name);
      console.log('Valor:', planConfig.price / 100, planConfig.currency.toUpperCase());
      
      // Retornar uma URL de demonstração
      const demoUrl = `${req.headers.origin}/success?demo=true&plan=${planId}&amount=${planConfig.price}&currency=${planConfig.currency}`;
      
      return res.status(200).json({ 
        success: true,
        sessionId: 'demo_session_' + Date.now(),
        url: demoUrl,
        demo: true,
        message: 'Modo demonstração - chave do Stripe não configurada'
      });
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: planConfig.price > 0 ? 'subscription' : 'setup',
      payment_method_types: ['card'],
      line_items: planConfig.price > 0 ? [
        {
          price_data: {
            currency: planConfig.currency,
            product_data: {
              name: planConfig.name,
              description: planConfig.description,
            },
            recurring: {
              interval: planConfig.interval,
            },
            unit_amount: planConfig.price,
          },
          quantity: 1,
        },
      ] : undefined,
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
      cancel_url: `${req.headers.origin}/planos?cancelled=true`,
      customer_email: userEmail,
      metadata: {
        userId: userId.toString(),
        planId: planId,
      },
      subscription_data: planConfig.price > 0 ? {
        trial_period_days: planConfig.trialDays,
        metadata: {
          userId: userId.toString(),
          planId: planId,
        },
      } : undefined,
    };

    // Para planos FLEX (sem mensalidade), configurar apenas setup de pagamento
    if (planConfig.price === 0) {
      sessionParams.mode = 'setup';
      sessionParams.setup_intent_data = {
        metadata: {
          userId: userId.toString(),
          planId: planId,
          plan_type: 'commission_only'
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    res.status(200).json({ 
      success: true,
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    // Em caso de erro com Stripe, também oferecer modo demo
    const { planId } = req.body;
    const planConfig = planConfigs[planId];
    
    if (planConfig) {
      const demoUrl = `${req.headers.origin}/success?demo=true&plan=${planId}&amount=${planConfig.price}&currency=${planConfig.currency}`;
      
      return res.status(200).json({ 
        success: true,
        sessionId: 'demo_session_fallback_' + Date.now(),
        url: demoUrl,
        demo: true,
        message: 'Usando modo demonstração devido a erro no Stripe'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
