// Exemplo de uso da nova estrutura dos planos CoinBitClub

import {
  PLANS,
  getPlanById,
  getPlanByStripeProductId,
  getPlansByRegion,
  getPlansByType,
  calculateCommission,
  validateMinimumBalance,
  formatPrice,
  getDefaultPlanForRegion,
  calculateAffiliateCommission
} from '../src/lib/plans';

// Exemplo 1: Buscar planos por região
console.log('=== Planos Brasil ===');
const planosBrasil = getPlansByRegion('brazil');
planosBrasil.forEach(plan => {
  console.log(`${plan.name}: ${formatPrice(plan.monthlyPrice, plan.currency)}/mês`);
  console.log(`Comissão: ${plan.commissionRate}% sobre lucros`);
  console.log(`Saldo mínimo: ${formatPrice(plan.minimumBalance, plan.currency)}`);
  console.log(`Stripe ID: ${plan.stripeProductId}`);
  console.log('---');
});

console.log('\n=== Planos Internacionais ===');
const planosInternacionais = getPlansByRegion('international');
planosInternacionais.forEach(plan => {
  console.log(`${plan.name}: ${formatPrice(plan.monthlyPrice, plan.currency)}/month`);
  console.log(`Commission: ${plan.commissionRate}% on profits`);
  console.log(`Minimum balance: ${formatPrice(plan.minimumBalance, plan.currency)}`);
  console.log(`Stripe ID: ${plan.stripeProductId}`);
  console.log('---');
});

// Exemplo 2: Calcular comissões
console.log('\n=== Cálculo de Comissões ===');
const lucroExemplo = 1000; // R$ 1000 ou $1000 de lucro

planosBrasil.forEach(plan => {
  const comissao = calculateCommission(lucroExemplo, plan.id);
  console.log(`${plan.name}: Lucro de ${formatPrice(lucroExemplo, plan.currency)} = Comissão de ${formatPrice(comissao, plan.currency)}`);
});

// Exemplo 3: Validar saldo mínimo
console.log('\n=== Validação de Saldo Mínimo ===');
const saldoUsuario = 100; // R$ 100

planosBrasil.forEach(plan => {
  const podeOperar = validateMinimumBalance(saldoUsuario, plan.id);
  console.log(`${plan.name}: Saldo R$ ${saldoUsuario} - ${podeOperar ? 'PODE OPERAR' : 'SALDO INSUFICIENTE'}`);
});

// Exemplo 4: Buscar por ID do Stripe
console.log('\n=== Busca por Stripe Product ID ===');
const stripeId = 'prod_SbHejGiPSr1asV';
const planoPorStripe = getPlanByStripeProductId(stripeId);
if (planoPorStripe) {
  console.log(`Encontrado: ${planoPorStripe.name} - ${formatPrice(planoPorStripe.monthlyPrice, planoPorStripe.currency)}`);
}

// Exemplo 5: Planos recomendados
console.log('\n=== Planos Recomendados ===');
const planoRecomendadoBR = getDefaultPlanForRegion('brazil');
const planoRecomendadoINT = getDefaultPlanForRegion('international');

console.log(`Brasil: ${planoRecomendadoBR.name} (${planoRecomendadoBR.isPopular ? 'POPULAR' : 'padrão'})`);
console.log(`Internacional: ${planoRecomendadoINT.name} (${planoRecomendadoINT.isPopular ? 'POPULAR' : 'padrão'})`);

// Exemplo 6: Comissão de afiliados
console.log('\n=== Sistema de Afiliados ===');
const lucroAfiliado = 5000; // R$ 5000 de lucro do indicado
const comissaoAfiliado = calculateAffiliateCommission(lucroAfiliado);
console.log(`Lucro do indicado: R$ ${lucroAfiliado}`);
console.log(`Comissão do afiliado (1.5%): R$ ${comissaoAfiliado.toFixed(2)}`);

// Exemplo 7: Comparativo mensal vs pré-pago
console.log('\n=== Comparativo: Mensal vs Pré-pago ===');
const lucroMensal = 2000; // R$ 2000 de lucro no mês

const planoMensal = getPlanById('monthly_brazil');
const planoPrepago = getPlanById('prepaid_brazil');

if (planoMensal && planoPrepago) {
  const comissaoMensal = calculateCommission(lucroMensal, planoMensal.id);
  const custoTotalMensal = planoMensal.monthlyPrice + comissaoMensal;
  
  const comissaoPrepago = calculateCommission(lucroMensal, planoPrepago.id);
  const custoTotalPrepago = comissaoPrepago; // Sem mensalidade
  
  console.log(`Plano Mensal:`);
  console.log(`  Mensalidade: ${formatPrice(planoMensal.monthlyPrice, planoMensal.currency)}`);
  console.log(`  Comissão (${planoMensal.commissionRate}%): ${formatPrice(comissaoMensal, planoMensal.currency)}`);
  console.log(`  Total: ${formatPrice(custoTotalMensal, planoMensal.currency)}`);
  
  console.log(`Plano Pré-pago:`);
  console.log(`  Mensalidade: ${formatPrice(0, planoPrepago.currency)}`);
  console.log(`  Comissão (${planoPrepago.commissionRate}%): ${formatPrice(comissaoPrepago, planoPrepago.currency)}`);
  console.log(`  Total: ${formatPrice(custoTotalPrepago, planoPrepago.currency)}`);
  
  const economia = custoTotalMensal - custoTotalPrepago;
  console.log(`Diferença: ${formatPrice(Math.abs(economia), planoMensal.currency)} ${economia > 0 ? '(Pré-pago mais barato)' : '(Mensal mais barato)'}`);
}

export {};
