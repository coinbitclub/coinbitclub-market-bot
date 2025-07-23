import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-06-30.basil',
});

// Planos disponíveis
export const PLANS = {
  basic: {
    name: 'Basic',
    price: 9700, // R$ 97.00 em centavos
    currency: 'brl',
    interval: 'month',
    features: [
      'Sinais de trading em tempo real',
      'Análise técnica automatizada',
      'Suporte por email',
      'Dashboard básico',
      'Histórico de 30 dias'
    ]
  },
  pro: {
    name: 'Pro',
    price: 19700, // R$ 197.00 em centavos
    currency: 'brl',
    interval: 'month',
    features: [
      'Todos os recursos do Basic',
      'IA avançada para análise',
      'Sinais premium exclusivos',
      'Suporte prioritário 24/7',
      'Dashboard avançado',
      'Histórico completo',
      'Copy trading automatizado',
      'Relatórios personalizados'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 49700, // R$ 497.00 em centavos
    currency: 'brl',
    interval: 'month',
    features: [
      'Todos os recursos do Pro',
      'Consultoria personalizada',
      'API privada',
      'Configurações customizadas',
      'Manager dedicado',
      'Análise de risco avançada',
      'Integração com exchanges',
      'Treinamentos exclusivos'
    ]
  }
};

// Criar ou recuperar customer do Stripe
export const getOrCreateStripeCustomer = async (userId: string, email: string, name: string) => {
  try {
    // Primeiro tentar encontrar customer existente
    const customers = await stripe.customers.list({
      email,
      limit: 1
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Criar novo customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId
      }
    });

    return customer;
  } catch (error) {
    console.error('Erro ao criar/buscar customer:', error);
    throw error;
  }
};

// Criar sessão de checkout
export const createCheckoutSession = async (
  userId: string,
  email: string,
  name: string,
  planType: keyof typeof PLANS,
  successUrl: string,
  cancelUrl: string
) => {
  try {
    const plan = PLANS[planType];
    if (!plan) {
      throw new Error('Plano inválido');
    }

    const customer = await getOrCreateStripeCustomer(userId, email, name);

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: `CoinBitClub ${plan.name}`,
              description: plan.features.join(', '),
              images: [`${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`]
            },
            unit_amount: plan.price,
            recurring: {
              interval: plan.interval as 'month'
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planType,
        source: 'coinbitclub'
      },
      subscription_data: {
        metadata: {
          userId,
          planType
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      locale: 'pt-BR'
    });

    return session;
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    throw error;
  }
};

// Criar portal do customer para gerenciar assinatura
export const createCustomerPortal = async (
  customerId: string,
  returnUrl: string
) => {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });

    return session;
  } catch (error) {
    console.error('Erro ao criar portal do customer:', error);
    throw error;
  }
};

// Cancelar assinatura
export const cancelSubscription = async (subscriptionId: string) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    return subscription;
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    throw error;
  }
};

// Reativar assinatura
export const reactivateSubscription = async (subscriptionId: string) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });

    return subscription;
  } catch (error) {
    console.error('Erro ao reativar assinatura:', error);
    throw error;
  }
};

// Obter detalhes da assinatura
export const getSubscriptionDetails = async (subscriptionId: string) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'latest_invoice']
    });

    return subscription;
  } catch (error) {
    console.error('Erro ao obter detalhes da assinatura:', error);
    throw error;
  }
};

// Criar desconto/cupom
export const createCoupon = async (
  name: string,
  percentOff: number,
  duration: 'once' | 'repeating' | 'forever',
  durationInMonths?: number
) => {
  try {
    const coupon = await stripe.coupons.create({
      name,
      percent_off: percentOff,
      duration,
      duration_in_months: durationInMonths
    });

    return coupon;
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    throw error;
  }
};

// Verificar status do pagamento
export const verifyPaymentStatus = async (sessionId: string) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    });

    return {
      status: session.payment_status,
      subscription: session.subscription,
      customer: session.customer,
      metadata: session.metadata
    };
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    throw error;
  }
};

export default stripe;
