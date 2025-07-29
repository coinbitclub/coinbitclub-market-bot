/**
 * 🎯 CONFIGURADOR DE CHAVES DE PRODUÇÃO
 * Sistema para configurar e validar chaves reais de produção
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 CONFIGURADOR DE CHAVES DE PRODUÇÃO');
console.log('=====================================\n');

class ConfiguradorProducao {
    constructor() {
        this.arquivoProducao = '.env.producao';
        this.arquivoTestnet = '.env.test-mauro-completo';
    }

    verificarChavesExistentes() {
        console.log('📋 VERIFICANDO CHAVES EXISTENTES');
        console.log('─'.repeat(35));

        // Verificar arquivo de testnet
        if (fs.existsSync(this.arquivoTestnet)) {
            console.log('✅ Arquivo testnet encontrado:', this.arquivoTestnet);
            const conteudoTestnet = fs.readFileSync(this.arquivoTestnet, 'utf8');
            console.log('📊 Chaves testnet configuradas:');
            this.analisarChaves(conteudoTestnet, 'TESTNET');
        }

        console.log('');

        // Verificar arquivo de produção
        if (fs.existsSync(this.arquivoProducao)) {
            console.log('✅ Arquivo produção encontrado:', this.arquivoProducao);
            const conteudoProducao = fs.readFileSync(this.arquivoProducao, 'utf8');
            console.log('📊 Chaves produção configuradas:');
            this.analisarChaves(conteudoProducao, 'PRODUÇÃO');
        } else {
            console.log('⚠️  Arquivo de produção não encontrado');
        }

        console.log('');
    }

    analisarChaves(conteudo, ambiente) {
        const linhas = conteudo.split('\n');
        const chaves = {};

        linhas.forEach(linha => {
            if (linha.includes('=') && !linha.startsWith('#')) {
                const [key, value] = linha.split('=');
                chaves[key.trim()] = value.trim();
            }
        });

        // Analisar Binance
        if (chaves.BINANCE_API_KEY && !chaves.BINANCE_API_KEY.includes('SUA_CHAVE')) {
            console.log(`   🟡 Binance: Configurada (${chaves.BINANCE_TESTNET === 'true' ? 'TESTNET' : 'PRODUÇÃO'})`);
            console.log(`      Key: ${chaves.BINANCE_API_KEY.substring(0, 8)}...`);
        } else {
            console.log('   🟡 Binance: Não configurada');
        }

        // Analisar Bybit
        if (chaves.BYBIT_API_KEY && !chaves.BYBIT_API_KEY.includes('SUA_CHAVE')) {
            console.log(`   🔵 Bybit: Configurada (${chaves.BYBIT_TESTNET === 'true' ? 'TESTNET' : 'PRODUÇÃO'})`);
            console.log(`      Key: ${chaves.BYBIT_API_KEY.substring(0, 8)}...`);
        } else {
            console.log('   🔵 Bybit: Não configurada');
        }

        // Analisar OKX
        if (chaves.OKX_API_KEY && !chaves.OKX_API_KEY.includes('SUA_CHAVE')) {
            console.log(`   🟠 OKX: Configurada (${chaves.OKX_TESTNET === 'true' ? 'TESTNET' : 'PRODUÇÃO'})`);
            console.log(`      Key: ${chaves.OKX_API_KEY.substring(0, 8)}...`);
        } else {
            console.log('   🟠 OKX: Não configurada');
        }
    }

    gerarInstrucoes() {
        console.log('📋 INSTRUÇÕES PARA CONFIGURAR PRODUÇÃO');
        console.log('═'.repeat(40));

        console.log('\n🎯 VOCÊ TEM DUAS OPÇÕES:');
        console.log('');

        console.log('1️⃣  MIGRAR DO TESTNET PARA PRODUÇÃO:');
        console.log('   • Obter chaves reais das exchanges');
        console.log('   • Editar .env.producao com suas chaves');
        console.log('   • Configurar TESTNET=false');
        console.log('   • Executar teste de produção');
        console.log('');

        console.log('2️⃣  CONTINUAR NO TESTNET:');
        console.log('   • Manter configuração atual');
        console.log('   • Usar apenas para desenvolvimento');
        console.log('   • Sem riscos financeiros');
        console.log('');

        console.log('🔧 COMO OBTER CHAVES DE PRODUÇÃO:');
        console.log('');
        console.log('🟡 BINANCE:');
        console.log('   1. Acesse: https://www.binance.com/pt/my/settings/api-management');
        console.log('   2. Crie nova API Key');
        console.log('   3. Permissões: Spot & Margin Trading + Futures');
        console.log('   4. Configure IP permitido (recomendado)');
        console.log('');

        console.log('🔵 BYBIT:');
        console.log('   1. Acesse: https://www.bybit.com/app/user/api-management');
        console.log('   2. Crie nova API Key');
        console.log('   3. Permissões: Spot Trading + Derivatives');
        console.log('   4. Configure IP permitido (recomendado)');
        console.log('');

        console.log('🟠 OKX (Opcional):');
        console.log('   1. Acesse: https://www.okx.com/account/my-api');
        console.log('   2. Crie nova API Key');
        console.log('   3. Permissões: Trading + Read');
        console.log('   4. Defina passphrase forte');
        console.log('');

        console.log('⚠️  IMPORTANTE:');
        console.log('   • NUNCA compartilhe suas chaves');
        console.log('   • Use sempre restrições de IP');
        console.log('   • Comece com valores pequenos');
        console.log('   • Teste sempre no testnet primeiro');
        console.log('');

        console.log('🚀 PRÓXIMOS PASSOS:');
        console.log('   1. Configure suas chaves em .env.producao');
        console.log('   2. Execute: node teste-producao-completo.js');
        console.log('   3. Valide todas as exchanges');
        console.log('   4. Configure estratégias de trading');
        console.log('   5. Ative o bot em produção');
    }

    executar() {
        this.verificarChavesExistentes();
        this.gerarInstrucoes();

        console.log('\n═'.repeat(50));
        console.log('✅ CONFIGURADOR EXECUTADO COM SUCESSO!');
        console.log('📞 Suporte: @CoinbitClub no Telegram');
    }
}

// Executar configurador
const configurador = new ConfiguradorProducao();
configurador.executar();
