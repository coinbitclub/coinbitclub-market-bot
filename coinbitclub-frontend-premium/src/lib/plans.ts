// Configuração dos planos CoinBitClub
export interface Plan {
  id: string;
  type: 'monthly' | 'prepaid';
  region: 'brazil' | 'international';
  name: string;
  monthlyPrice: number; // 0 para planos prepagos
  currency: 'BRL' | 'USD';
  commissionRate: number; // Porcentagem sobre lucros
  minimumBalance: number; // Saldo mínimo para operar
  stripeProductId: string;
  features: string[];
  description: string;
  isPopular?: boolean;
}

// Planos disponíveis com IDs reais do Stripe
export const PLANS: Plan[] = [
  // Planos Brasil
  {
    id: 'monthly_brazil',
    type: 'monthly',
    region: 'brazil',
    name: 'Brasil PRO',
    monthlyPrice: 297, // R$ 297/mês - VALOR CORRETO CONFORME ESPECIFICAÇÃO
    currency: 'BRL',
    commissionRate: 10, // 10% sobre lucros
    minimumBalance: 100, // R$ 100 mínimo
    stripeProductId: 'prod_SbHejGiPSr1asV',
    features: [
      'Trading automatizado 24/7',
      'Máximo 2 operações simultâneas',
      'Relatórios IA a cada 4 horas',
      'Notificações WhatsApp',
      'Suporte prioritário',
      'Dashboard completo',
      'Análise de risco avançada'
    ],
    description: 'Plano mensal com comissão reduzida de 10% sobre os lucros',
    isPopular: true
  },
  {
    id: 'prepaid_brazil',
    type: 'prepaid',
    region: 'brazil',
    name: 'Brasil FLEX',
    monthlyPrice: 0, // Sem mensalidade
    currency: 'BRL',
    commissionRate: 20, // 20% sobre lucros
    minimumBalance: 100, // R$ 100 mínimo - AJUSTADO
    stripeProductId: 'prod_SbHgHezeyKfTVg',
    features: [
      'Trading automatizado 24/7',
      'Máximo 2 operações simultâneas',
      'Relatórios IA a cada 4 horas',
      'Notificações WhatsApp',
      'Suporte padrão',
      'Dashboard completo',
      'Sem mensalidade - apenas comissão'
    ],
    description: 'Plano pré-pago exclusivo sem mensalidade, apenas 20% sobre lucros'
  },
  
  // Planos Internacionais
  {
    id: 'monthly_international',
    type: 'monthly',
    region: 'international',
    name: 'Global PRO',
    monthlyPrice: 50, // $50/mês - CORRIGIDO CONFORME ESPECIFICAÇÃO
    currency: 'USD',
    commissionRate: 10, // 10% sobre lucros
    minimumBalance: 20, // $20 mínimo - AJUSTADO
    stripeProductId: 'prod_SbHhz5Ht3q1lul',
    features: [
      '24/7 Automated Trading',
      'Maximum 2 simultaneous operations',
      'AI Reports every 4 hours',
      'WhatsApp Notifications',
      'Priority Support',
      'Complete Dashboard',
      'Advanced Risk Analysis'
    ],
    description: 'Monthly plan with reduced 10% commission on profits'
  },
  {
    id: 'prepaid_international',
    type: 'prepaid',
    region: 'international',
    name: 'Global FLEX',
    monthlyPrice: 0, // Sem mensalidade
    currency: 'USD',
    commissionRate: 20, // 20% sobre lucros
    minimumBalance: 20, // $20 mínimo - AJUSTADO
    stripeProductId: 'prod_SbHiDqfrH2T8dI',
    features: [
      '24/7 Automated Trading',
      'Maximum 2 simultaneous operations',
      'AI Reports every 4 hours',
      'WhatsApp Notifications',
      'Standard Support',
      'Complete Dashboard',
      'No monthly fee - commission only'
    ],
    description: 'Exclusive prepaid plan with no monthly fee, only 20% on profits'
  }
];

// Funções auxiliares para trabalhar com planos
export function getPlanById(planId: string): Plan | undefined {
  return PLANS.find(plan => plan.id === planId);
}

export function getPlanByStripeProductId(stripeProductId: string): Plan | undefined {
  return PLANS.find(plan => plan.stripeProductId === stripeProductId);
}

export function getPlansByRegion(region: 'brazil' | 'international'): Plan[] {
  return PLANS.filter(plan => plan.region === region);
}

export function getPlansByType(type: 'monthly' | 'prepaid'): Plan[] {
  return PLANS.filter(plan => plan.type === type);
}

export function calculateCommission(profit: number, planId: string): number {
  const plan = getPlanById(planId);
  if (!plan) return 0;
  
  return (profit * plan.commissionRate) / 100;
}

export function validateMinimumBalance(balance: number, planId: string): boolean {
  const plan = getPlanById(planId);
  if (!plan) return false;
  
  return balance >= plan.minimumBalance;
}

export function formatPrice(amount: number, currency: 'BRL' | 'USD'): string {
  const formatter = new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: currency
  });
  
  return formatter.format(amount);
}

export function getDefaultPlanForRegion(region: 'brazil' | 'international'): Plan {
  const regionPlans = getPlansByRegion(region);
  // Retorna o plano mensal como padrão (popular)
  return regionPlans.find(plan => plan.type === 'monthly') || regionPlans[0];
}

// Configurações do sistema de afiliados
export const AFFILIATE_COMMISSION_RATE = 0.015; // 1.5% do retorno obtido pelo indicado

export const PAYOUT_RULES = {
  minDaysBetweenRequests: 20,
  monthlyPayoutDay: 5, // Até o 5º dia útil do mês
  currency: {
    exchangeRate: 'first_business_day_of_month' // Taxa do 1º dia útil do mês
  }
};

export const DEFAULT_TRADING_SETTINGS = {
  maxLeverage: 10,
  maxStopLoss: 5, // 5%
  maxPercentPerTrade: 2, // 2% do saldo por operação
  maxConcurrentTrades: 2
};

// Tipos para integração com Stripe
export interface StripeSubscriptionData {
  customerId: string;
  planId: string;
  productId: string;
  subscriptionId?: string;
  status: 'active' | 'inactive' | 'past_due' | 'canceled';
}

// Validação de plano ativo
export function isActivePlan(subscriptionData: StripeSubscriptionData): boolean {
  return subscriptionData.status === 'active';
}

export function calculateAffiliateCommission(userProfit: number): number {
  return userProfit * AFFILIATE_COMMISSION_RATE;
}

// Função para obter preço do plano baseado no país
export function getPlanPrice(planId: string, country: string) {
  const plan = getPlanById(planId);
  if (!plan) {
    return { amount: 0, currency: 'BRL' };
  }
  
  return {
    amount: plan.monthlyPrice,
    currency: plan.currency
  };
}

export default PLANS;
