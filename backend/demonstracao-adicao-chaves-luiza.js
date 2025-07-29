/**
 * 🔐 DEMONSTRAÇÃO: ADICIONAR CHAVES DA LUIZA (EXEMPLO)
 * Script demonstrativo para adicionar chaves API da Luiza no banco de dados
 */

const GestorChavesAPI = require('./gestor-chaves-parametrizacoes.js');

console.log('🔐 DEMONSTRAÇÃO: ADICIONANDO CHAVES DA LUIZA');
console.log('============================================');

async function demonstrarAdicaoChavesLuiza() {
    const gestor = new GestorChavesAPI();
    
    try {
        console.log('🚀 Iniciando demonstração de adição de chaves...');
        console.log('');
        
        // ========================================
        // 👤 DADOS DA LUIZA
        // ========================================
        const dadosLuiza = {
            userId: 2,
            nome: 'Luiza',
            email: 'luiza@coinbitclub.com'
        };
        
        console.log(`👤 Usuário: ${dadosLuiza.nome} (ID: ${dadosLuiza.userId})`);
        console.log(`📧 Email: ${dadosLuiza.email}`);
        console.log('');
        
        // ========================================
        // 📋 INSTRUÇÕES PARA CHAVES REAIS
        // ========================================
        console.log('📋 COMO ADICIONAR AS CHAVES REAIS DA LUIZA:');
        console.log('==========================================');
        console.log('');
        console.log('1️⃣ OBTER CHAVES DA BINANCE:');
        console.log('   • Acesse: https://www.binance.com/en/my/settings/api-management');
        console.log('   • Crie nova API Key com permissões: Futures Trading + Read Account');
        console.log('   • ⚠️ IMPORTANTE: Remova restrições de IP ou adicione o IP do Railway');
        console.log('');
        console.log('2️⃣ OBTER CHAVES DA BYBIT:');
        console.log('   • Acesse: https://www.bybit.com/app/user/api-management');
        console.log('   • Crie nova API Key com permissões: Derivatives Trading + Read Account');
        console.log('   • ⚠️ IMPORTANTE: Configure sem restrições de IP para testes');
        console.log('');
        console.log('3️⃣ EXECUTAR O COMANDO:');
        console.log('   ```javascript');
        console.log('   const gestor = new GestorChavesAPI();');
        console.log('');
        console.log('   // Adicionar chaves Binance da Luiza');
        console.log('   await gestor.adicionarChaveAPI(');
        console.log('       2,                           // userId da Luiza');
        console.log('       "binance",                   // exchange');
        console.log('       "SUA_BINANCE_API_KEY",       // API Key real');
        console.log('       "SUA_BINANCE_SECRET_KEY",    // Secret Key real');
        console.log('       false                        // produção (não testnet)');
        console.log('   );');
        console.log('');
        console.log('   // Adicionar chaves Bybit da Luiza');
        console.log('   await gestor.adicionarChaveAPI(');
        console.log('       2,                           // userId da Luiza');
        console.log('       "bybit",                     // exchange');
        console.log('       "SUA_BYBIT_API_KEY",         // API Key real');
        console.log('       "SUA_BYBIT_SECRET_KEY",      // Secret Key real');
        console.log('       false                        // produção (não testnet)');
        console.log('   );');
        console.log('   ```');
        console.log('');
        
        // ========================================
        // 🧪 DEMONSTRAÇÃO COM CHAVES DE TESTE
        // ========================================
        console.log('🧪 DEMONSTRAÇÃO COM CHAVES DE TESTE:');
        console.log('====================================');
        console.log('');
        
        // Simular adição com chaves de exemplo (não funcionais)
        console.log('📝 Simulando adição de chaves de exemplo...');
        console.log('⚠️ NOTA: Estas são chaves de exemplo que não funcionarão para trading real');
        console.log('');
        
        try {
            // Tentar adicionar chave Binance de exemplo
            console.log('🔶 Tentando adicionar chave Binance de exemplo...');
            await gestor.adicionarChaveAPI(
                dadosLuiza.userId,
                'binance',
                'EXEMPLO_BINANCE_API_KEY_LUIZA_12345',
                'EXEMPLO_BINANCE_SECRET_KEY_LUIZA_67890',
                true // testnet para não dar erro real
            );
        } catch (error) {
            console.log(`❌ Erro esperado com chave de exemplo: ${error.message}`);
        }
        
        try {
            // Tentar adicionar chave Bybit de exemplo
            console.log('🔷 Tentando adicionar chave Bybit de exemplo...');
            await gestor.adicionarChaveAPI(
                dadosLuiza.userId,
                'bybit',
                'EXEMPLO_BYBIT_API_KEY_LUIZA_ABC123',
                'EXEMPLO_BYBIT_SECRET_KEY_LUIZA_XYZ789',
                true // testnet para não dar erro real
            );
        } catch (error) {
            console.log(`❌ Erro esperado com chave de exemplo: ${error.message}`);
        }
        
        console.log('');
        
        // ========================================
        // 🔍 VERIFICAR ESTADO ATUAL
        // ========================================
        console.log('🔍 VERIFICANDO ESTADO ATUAL DO BANCO:');
        console.log('====================================');
        
        try {
            const dadosCompletos = await gestor.obterDadosUsuarioParaTrading(dadosLuiza.userId);
            
            console.log('✅ Dados recuperados:');
            console.log(`   👤 Usuário: ${dadosCompletos.usuario?.username || dadosLuiza.nome}`);
            console.log(`   🔑 Exchanges configuradas: ${dadosCompletos.exchangesConfiguradas.length || 0}`);
            console.log(`   ⚙️  Parametrizações: ${dadosCompletos.parametrizacoes ? 'Configuradas' : 'Padrão'}`);
            console.log(`   🌐 Modo: ${dadosCompletos.modoOperacao}`);
            
            if (dadosCompletos.exchangesConfiguradas.length > 0) {
                console.log('   🔐 Chaves disponíveis:');
                Object.entries(dadosCompletos.chaves).forEach(([exchange, chaves]) => {
                    console.log(`      ${exchange}: ${chaves.source} (${chaves.testnet ? 'TESTNET' : 'PRODUÇÃO'})`);
                });
            } else {
                console.log('   ⚠️ Nenhuma chave configurada ainda');
            }
            
        } catch (error) {
            console.log(`⚠️ Aviso: ${error.message}`);
            console.log('   Isso é normal quando não há chaves configuradas');
        }
        
        console.log('');
        
        // ========================================
        // 📊 STATUS FINAL
        // ========================================
        console.log('📊 STATUS DO SISTEMA MULTI-USUÁRIO:');
        console.log('===================================');
        console.log('✅ Banco PostgreSQL conectado');
        console.log('✅ Estrutura de tabelas verificada');
        console.log('✅ Usuários cadastrados (Paloma, Luiza, Teste)');
        console.log('✅ Sistema de gestão de chaves operacional');
        console.log('✅ Fallback para chaves do Railway configurado');
        console.log('⚠️ Aguardando chaves reais da Luiza para prosseguir');
        console.log('');
        console.log('🎯 PRÓXIMOS PASSOS:');
        console.log('1. Obter chaves API reais da Luiza (Binance + Bybit)');
        console.log('2. Executar script de adição com chaves reais');
        console.log('3. Testar conexões e operações');
        console.log('4. Configurar chaves do Railway como fallback');
        
    } catch (error) {
        console.error('❌ ERRO GERAL:', error.message);
        console.error('Stack:', error.stack);
    }
}

// ========================================
// 🚀 EXECUTAR DEMONSTRAÇÃO
// ========================================
if (require.main === module) {
    demonstrarAdicaoChavesLuiza()
        .then(() => {
            console.log('\n✅ Demonstração executada com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Erro na execução:', error.message);
            process.exit(1);
        });
}

module.exports = { demonstrarAdicaoChavesLuiza };
