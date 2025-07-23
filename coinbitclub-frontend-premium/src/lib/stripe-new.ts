import Stripe from 'stripe';

const stripe = new Stripe(
  process.env.NODE_ENV === 'production'
    ? process.env.STRIPE_LIVE_SECRET_KEY!
    : process.env.STRIPE_TEST_SECRET_KEY!,
  { apiVersion: '2025-06-30.basil' }
);

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customerId: string;
  priceId: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutSessionData {
  customerId?: string;
  priceId: string;
  userEmail: string;
  userName?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

// IDs reais x IDs de teste
export const STRIPE_PRICE_IDS = {
  monthly_brazil: process.env.NODE_ENV === 'production'
    ? 'prod_SbHejGiPSr1asV'
    : 'price_monthly_brl_test',
  prepaid_brazil: process.env.NODE_ENV === 'production'
    ? 'prod_SbHgHezeyKfTVg'
    : 'price_prepaid_brl_test',
  monthly_international: process.env.NODE_ENV === 'production'
    ? 'prod_SbHhz5Ht3q1lul'
    : 'price_monthly_usd_test',
  prepaid_international: process.env.NODE_ENV === 'production'
    ? 'prod_SbHiDqfrH2T8dI'
    : 'price_prepaid_usd_test',
};

export class StripeService {
  // Cria ou recupera customer
  async createOrRetrieveCustomer(
    email: string,
    name?: string,
    userId?: string
  ): Promise<StripeCustomer> {
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length) {
      const c = existing.data[0];
      return { id: c.id, email: c.email!, name: c.name || undefined, phone: c.phone || undefined, metadata: c.metadata };
    }
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { ...(userId ? { userId } : {}), createdAt: new Date().toISOString() }
    });
    return { id: customer.id, email: customer.email!, name: customer.name || undefined, phone: customer.phone || undefined, metadata: customer.metadata };
  }

  // Cria sessão ou pagamento único dependendo do planType
  async createCheckoutSession(data: CheckoutSessionData): Promise<string> {
    const isPrepaid = [
      STRIPE_PRICE_IDS.prepaid_brazil,
      STRIPE_PRICE_IDS.prepaid_international
    ].includes(data.priceId);

    // customer
    const customer = data.customerId
      ? { id: (await stripe.customers.retrieve(data.customerId) as Stripe.Customer).id }
      : await this.createOrRetrieveCustomer(data.userEmail, data.userName, data.metadata?.userId);

    if (isPrepaid) {
      // pagamento único
      const amount = parseInt(data.metadata?.amountInCents || '0', 10);
      const pi = await stripe.paymentIntents.create({
        amount,
        currency: data.priceId.includes('brl') ? 'brl' : 'usd',
        customer: customer.id,
        metadata: { ...data.metadata, planType: 'prepaid' },
        automatic_payment_methods: { enabled: true }
      });
      return pi.client_secret!;
    }

    // assinatura
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: data.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: data.successUrl || process.env.STRIPE_SUCCESS_URL!,
      cancel_url: data.cancelUrl || process.env.STRIPE_CANCEL_URL!,
      subscription_data: {
        metadata: { ...data.metadata, planType: 'subscription' }
      },
      metadata: { ...data.metadata, planType: 'subscription' },
      billing_address_collection: 'required',
      locale: 'pt-BR'
    });

    return session.url!;
  }

  // Gera URL do portal do cliente
  async createCustomerPortalSession(customerId: string, returnUrl?: string): Promise<string> {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/user/settings`
    });
    return session.url;
  }

  // Obtém assinatura
  async getSubscription(id: string): Promise<StripeSubscription | null> {
    const sub = await stripe.subscriptions.retrieve(id);
    return {
      id: sub.id,
      customerId: sub.customer as string,
      priceId: sub.items.data[0].price.id,
      status: sub.status,
      currentPeriodStart: (sub as any).current_period_start,
      currentPeriodEnd: (sub as any).current_period_end,
      cancelAtPeriodEnd: (sub as any).cancel_at_period_end
    };
  }

  // Lista assinaturas
  async getCustomerSubscriptions(customerId: string): Promise<StripeSubscription[]> {
    const list = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 });
    return list.data.map(s => ({
      id: s.id,
      customerId: s.customer as string,
      priceId: s.items.data[0].price.id,
      status: s.status,
      currentPeriodStart: (s as any).current_period_start,
      currentPeriodEnd: (s as any).current_period_end,
      cancelAtPeriodEnd: (s as any).cancel_at_period_end
    }));
  }

  // Cancela assinatura
  async cancelSubscription(id: string, immediately = false): Promise<boolean> {
    if (immediately) {
      await stripe.subscriptions.cancel(id);
    } else {
      await stripe.subscriptions.update(id, { cancel_at_period_end: true });
    }
    return true;
  }

  // Reativa assinatura
  async reactivateSubscription(id: string): Promise<boolean> {
    await stripe.subscriptions.update(id, { cancel_at_period_end: false });
    return true;
  }

  // Reembolso de pagamento (prepaid ou charges)
  async refundPayment(paymentIntentId: string, amountInCents?: number): Promise<Stripe.Refund> {
    return stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amountInCents ? { amount: amountInCents } : {})
    });
  }

  // Verifica e retorna evento de webhook
  verifyWebhook(payload: string, sig: string) {
    const secret = process.env.NODE_ENV === 'production'
      ? process.env.STRIPE_WEBHOOK_SECRET!
      : process.env.STRIPE_TEST_WEBHOOK_SECRET!;
    const event = stripe.webhooks.constructEvent(payload, sig, secret);
    return { type: event.type, data: event.data };
  }

  // Métodos de pagamento
  async getCustomerPaymentMethods(customerId: string) {
    const list = await stripe.paymentMethods.list({ customer: customerId, type: 'card' });
    return list.data;
  }

  // Relatório de receita
  async getRevenueReport(start: Date, end: Date) {
    const charges = await stripe.charges.list({
      created: {
        gte: Math.floor(start.getTime() / 1e3),
        lte: Math.floor(end.getTime() / 1e3)
      },
      limit: 100
    });
    let total = 0, subs = 0, oneTime = 0, refunds = 0;
    for (const c of charges.data) {
      if (c.paid && !(c as any).refunded) {
        total += c.amount;
        if ((c as any).invoice) subs += c.amount;
        else oneTime += c.amount;
      }
      if ((c as any).refunded) refunds += (c as any).amount_refunded;
    }
    return {
      totalRevenue: total / 100,
      subscriptionRevenue: subs / 100,
      oneTimeRevenue: oneTime / 100,
      refunds: refunds / 100
    };
  }
}

export const stripeService = new StripeService();

// Utilitários
export function formatStripeAmount(amountInCents: number, currency: 'brl' | 'usd'): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat(currency === 'brl' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: currency === 'brl' ? 'BRL' : 'USD'
  }).format(amount);
}

export function getStripeAmountInCents(amount: number): number {
  return Math.round(amount * 100);
}

export function getSubscriptionStatusText(status: string): string {
  const map: Record<string, string> = {
    active: 'Ativa',
    canceled: 'Cancelada',
    incomplete: 'Incompleta',
    incomplete_expired: 'Expirada',
    past_due: 'Em atraso',
    trialing: 'Período de teste',
    unpaid: 'Não paga'
  };
  return map[status] || status;
}
