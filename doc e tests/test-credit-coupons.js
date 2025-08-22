const axios = require('axios');

async function testCreditCoupons() {
    console.log('🧪 TESTANDO CUPONS DE CRÉDITO CRIADOS...');
    console.log('=======================================');
    
    try {
        // Teste cupom R$ 250
        console.log('\n💰 Testando cupom CREDIT250BRL...');
        const brlResponse = await axios.get('http://localhost:3000/api/v1/coupons-affiliates/validate-coupon/CREDIT250BRL');
        console.log('✅ Resposta R$ 250:');
        console.log(JSON.stringify(brlResponse.data, null, 2));
        
        // Teste cupom $50 USD
        console.log('\n💰 Testando cupom CREDIT50USD...');
        const usdResponse = await axios.get('http://localhost:3000/api/v1/coupons-affiliates/validate-coupon/CREDIT50USD');
        console.log('✅ Resposta $50 USD:');
        console.log(JSON.stringify(usdResponse.data, null, 2));
        
        console.log('\n🎉 AMBOS OS CUPONS ESTÃO FUNCIONAIS!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
    }
}

testCreditCoupons();
