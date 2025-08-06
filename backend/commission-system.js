// COMMISSION SYSTEM
// Sistema de comissões enterprise baseado nas especificações reais

class CommissionSystem {
    constructor() {
        // Configurações das variáveis de ambiente ou valores padrão
        this.commissionRates = {
            MONTHLY_BRAZIL: parseFloat(process.env.COMMISSION_MONTHLY_BRAZIL) || 10,   // 10% para plano mensal Brasil
            MONTHLY_FOREIGN: parseFloat(process.env.COMMISSION_MONTHLY_FOREIGN) || 10, // 10% para plano mensal exterior
            PREPAID_BRAZIL: parseFloat(process.env.COMMISSION_PREPAID_BRAZIL) || 20,   // 20% para plano pré-pago Brasil
            PREPAID_FOREIGN: parseFloat(process.env.COMMISSION_PREPAID_FOREIGN) || 20  // 20% para plano pré-pago exterior
        };

        this.affiliateRates = {
            normal: parseFloat(process.env.AFFILIATE_NORMAL_RATE) || 1.5,  // 1.5% para afiliados normais
            vip: parseFloat(process.env.AFFILIATE_VIP_RATE) || 5.0         // 5.0% para afiliados VIP
        };
        
        this.minimumCommission = 1.0; // Mínimo R$ 1,00
    }

    calculateCommission(data) {
        const {
            profit = 0,
            plan = 'MONTHLY_BRAZIL',
            affiliateType = 'none',
            country = 'BR'
        } = data;

        if (profit <= 0) {
            return {
                companyCommission: 0,
                affiliateCommission: 0,
                netProfit: profit,
                rate: 0,
                details: 'Sem lucro para calcular comissão'
            };
        }

        // Determinar taxa de comissão da empresa baseada no plano e país
        let planKey = plan;
        if (plan === 'MONTHLY') {
            planKey = country === 'BR' ? 'MONTHLY_BRAZIL' : 'MONTHLY_FOREIGN';
        } else if (plan === 'PREPAID') {
            planKey = country === 'BR' ? 'PREPAID_BRAZIL' : 'PREPAID_FOREIGN';
        }

        const companyRate = this.commissionRates[planKey] || this.commissionRates.MONTHLY_BRAZIL;
        const companyCommission = Math.max(profit * (companyRate / 100), this.minimumCommission);

        // Calcular comissão do afiliado (sobre a comissão da empresa)
        let affiliateCommission = 0;
        if (affiliateType !== 'none' && this.affiliateRates[affiliateType]) {
            const affiliateRate = this.affiliateRates[affiliateType];
            affiliateCommission = companyCommission * (affiliateRate / 100);
        }

        const netProfit = profit - companyCommission;

        return {
            companyCommission: Math.round(companyCommission * 100) / 100,
            affiliateCommission: Math.round(affiliateCommission * 100) / 100,
            netProfit: Math.round(netProfit * 100) / 100,
            rates: {
                company: companyRate + '%',
                affiliate: affiliateType !== 'none' ? this.affiliateRates[affiliateType] + '%' : '0%'
            },
            details: `Comissão calculada sobre lucro de R$ ${profit.toFixed(2)}`,
            plan: planKey,
            affiliateType: affiliateType
        };
    }

    getCommissionInfo() {
        return {
            companyRates: {
                monthly_brazil: this.commissionRates.MONTHLY_BRAZIL + '%',
                monthly_foreign: this.commissionRates.MONTHLY_FOREIGN + '%',
                prepaid_brazil: this.commissionRates.PREPAID_BRAZIL + '%',
                prepaid_foreign: this.commissionRates.PREPAID_FOREIGN + '%'
            },
            affiliateRates: {
                normal: this.affiliateRates.normal + '%',
                vip: this.affiliateRates.vip + '%'
            },
            minimum: `R$ ${this.minimumCommission.toFixed(2)}`,
            description: 'Sistema de comissões enterprise baseado no plano e localização do usuário'
        };
    }

    getPlansInfo() {
        return {
            commission_structure: this.getCommissionInfo(),
            calculation_rules: {
                company_commission: 'Calculada sobre o lucro bruto',
                affiliate_commission: 'Calculada sobre a comissão da empresa',
                minimum_commission: 'Valor mínimo garantido',
                plan_differentiation: 'Baseado em localização e tipo de assinatura'
            }
        };
    }

    validateCommissionData(data) {
        const errors = [];

        if (!data.profit || data.profit < 0) {
            errors.push('Lucro deve ser maior que zero');
        }

        const validPlans = ['MONTHLY', 'PREPAID', 'MONTHLY_BRAZIL', 'MONTHLY_FOREIGN', 'PREPAID_BRAZIL', 'PREPAID_FOREIGN'];
        if (!validPlans.includes(data.plan)) {
            errors.push('Plano deve ser um dos valores válidos: ' + validPlans.join(', '));
        }

        const validAffiliateTypes = ['none', 'normal', 'vip'];
        if (!validAffiliateTypes.includes(data.affiliateType)) {
            errors.push('Tipo de afiliado deve ser: none, normal ou vip');
        }

        const validCountries = ['BR', 'US', 'CA', 'UK', 'EU'];
        if (data.country && !validCountries.includes(data.country)) {
            errors.push('País deve ser um código válido: ' + validCountries.join(', '));
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = CommissionSystem;
