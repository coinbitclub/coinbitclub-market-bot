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

        // Porcentagem da comissão total que o afiliado recebe
        this.affiliateShares = {
            normal: parseFloat(process.env.AFFILIATE_NORMAL_SHARE) || 15,  // 15% da comissão total
            vip: parseFloat(process.env.AFFILIATE_VIP_SHARE) || 25         // 25% da comissão total
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
        const totalCommission = Math.max(profit * (companyRate / 100), this.minimumCommission);

        // Calcular comissão do afiliado (porcentagem da comissão total)
        let affiliateCommission = 0;
        let companyCommission = totalCommission;
        
        if (affiliateType !== 'none' && this.affiliateShares[affiliateType]) {
            const affiliateShare = this.affiliateShares[affiliateType];
            affiliateCommission = totalCommission * (affiliateShare / 100);
            companyCommission = totalCommission - affiliateCommission;
        }

        const netProfit = profit - totalCommission;

        return {
            totalCommission: Math.round(totalCommission * 100) / 100,
            companyCommission: Math.round(companyCommission * 100) / 100,
            affiliateCommission: Math.round(affiliateCommission * 100) / 100,
            netProfit: Math.round(netProfit * 100) / 100,
            rates: {
                total: companyRate + '%',
                company: Math.round((companyCommission / totalCommission * 100) * 100) / 100 + '%',
                affiliate: affiliateType !== 'none' ? this.affiliateShares[affiliateType] + '%' : '0%'
            },
            breakdown: {
                profit: `R$ ${profit.toFixed(2)}`,
                totalCommission: `R$ ${totalCommission.toFixed(2)}`,
                companyShare: `R$ ${companyCommission.toFixed(2)}`,
                affiliateShare: `R$ ${affiliateCommission.toFixed(2)}`,
                netProfit: `R$ ${netProfit.toFixed(2)}`
            },
            details: `Comissão total de ${companyRate}% sobre lucro de R$ ${profit.toFixed(2)}`,
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
            affiliateShares: {
                normal: this.affiliateShares.normal + '% da comissão total',
                vip: this.affiliateShares.vip + '% da comissão total'
            },
            minimum: `R$ ${this.minimumCommission.toFixed(2)}`,
            description: 'Sistema de comissões enterprise: empresa fica com 85%/75% e afiliado recebe 15%/25% da comissão total'
        };
    }

    getPlansInfo() {
        return {
            commission_structure: this.getCommissionInfo(),
            calculation_rules: {
                company_commission: 'Calculada sobre o lucro bruto',
                affiliate_commission: 'Calculada como porcentagem da comissão total (15% ou 25%)',
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
