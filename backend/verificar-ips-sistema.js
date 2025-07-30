/**
 * 🌐 VERIFICAÇÃO: IP DO COMPUTADOR LOCAL vs SERVIDOR RAILWAY
 * Esclarecer qual IP deve ser usado na whitelist
 */

const https = require('https');
const { exec } = require('child_process');

async function verificarIPs() {
    console.log('🌐 VERIFICAÇÃO: IPs DO SISTEMA');
    console.log('='.repeat(40));
    
    // 1. IP do seu computador local
    console.log('\n💻 1. IP DO SEU COMPUTADOR LOCAL:');
    
    const obterIPLocal = () => {
        return new Promise((resolve) => {
            https.get('https://api.ipify.org?format=json', (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const ip = JSON.parse(data).ip;
                        console.log(`   🏠 Seu IP público: ${ip}`);
                        console.log('   📝 Este é o IP da sua casa/escritório');
                        console.log('   ❌ NÃO é este que deve estar na whitelist Bybit');
                        resolve(ip);
                    } catch (error) {
                        console.log(`   ❌ Erro ao obter IP local: ${error.message}`);
                        resolve(null);
                    }
                });
            }).on('error', (error) => {
                console.log(`   ❌ Erro de conexão: ${error.message}`);
                resolve(null);
            });
        });
    };

    const ipLocal = await obterIPLocal();

    // 2. IP do servidor Railway (produção)
    console.log('\n🚀 2. IP DO SERVIDOR RAILWAY (PRODUÇÃO):');
    console.log('   🌐 IP do servidor: 132.255.160.140');
    console.log('   📍 Este é onde o sistema está rodando em produção');
    console.log('   ✅ ESTE é o IP que deve estar na whitelist Bybit');
    console.log('   🎯 É o IP que faz as chamadas para a API Bybit');

    // 3. Explicação detalhada
    console.log('\n📚 3. EXPLICAÇÃO DETALHADA:');
    console.log('='.repeat(30));
    
    console.log('\n🏠 SEU COMPUTADOR LOCAL:');
    if (ipLocal) {
        console.log(`   • IP: ${ipLocal}`);
    }
    console.log('   • Onde você está desenvolvendo/testando');
    console.log('   • Scripts Node.js rodando localmente');
    console.log('   • NÃO precisa estar na whitelist');
    
    console.log('\n🚀 SERVIDOR RAILWAY (PRODUÇÃO):');
    console.log('   • IP: 132.255.160.140');
    console.log('   • Onde o sistema roda 24/7');
    console.log('   • Recebe webhooks do TradingView');
    console.log('   • Faz trades reais via API Bybit');
    console.log('   • DEVE estar na whitelist Bybit');

    console.log('\n🔄 4. FLUXO DO SISTEMA EM PRODUÇÃO:');
    console.log('='.repeat(35));
    console.log('   TradingView → Railway (132.255.160.140) → Bybit API');
    console.log('   📡 Sinal      🚀 Servidor                🏦 Exchange');

    console.log('\n🎯 5. QUAL IP CONFIGURAR NA BYBIT:');
    console.log('='.repeat(35));
    console.log('   ✅ IP CORRETO: 132.255.160.140');
    console.log('   🌐 Este é o IP do servidor Railway');
    console.log('   📍 Onde o sistema roda em produção');
    console.log('   🔗 De onde partem as chamadas para Bybit');

    // 6. Verificar se estamos testando local ou remoto
    console.log('\n🧪 6. CONTEXTO ATUAL DOS TESTES:');
    console.log('='.repeat(30));
    
    if (ipLocal === '132.255.160.140') {
        console.log('   🤔 Você está testando do próprio servidor Railway');
        console.log('   ✅ IP local = IP servidor');
    } else {
        console.log('   💻 Você está testando do seu computador local');
        console.log('   🔗 Conectando ao banco Railway remotamente');
        console.log('   📡 Simulando chamadas que o servidor faria');
    }

    console.log('\n⚠️  7. IMPORTANTE - DIFERENÇA NOS TESTES:');
    console.log('='.repeat(40));
    console.log('   🏠 Testes do seu computador:');
    console.log('      • Podem falhar por IP diferente');
    console.log('      • Mas mostram se whitelist está correta');
    console.log('      • Usam mesmo banco e mesma lógica');
    
    console.log('\n   🚀 Sistema em produção (Railway):');
    console.log('      • Usa IP 132.255.160.140');
    console.log('      • Este IP DEVE estar na whitelist');
    console.log('      • É onde acontecem os trades reais');

    console.log('\n🔧 8. AÇÃO NECESSÁRIA:');
    console.log('='.repeat(20));
    console.log('   1. ✅ Configurar na Bybit: 132.255.160.140');
    console.log('   2. 🧪 Testar localmente para verificar');
    console.log('   3. 🚀 Sistema em produção funcionará');

    console.log('\n💡 RESUMO:');
    console.log('='.repeat(10));
    console.log('   • 132.255.160.140 = IP do servidor Railway (produção)');
    console.log('   • Este é o IP que deve estar na whitelist Bybit');
    console.log('   • Seus testes locais podem falhar até configurar');
    console.log('   • Mas sistema em produção funcionará após whitelist');

    console.log('\n🎯 CONCLUSÃO:');
    console.log('   Configure 132.255.160.140 na whitelist Bybit');
    console.log('   Este é o IP do ambiente de produção no Railway');
}

verificarIPs();
