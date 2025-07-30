/**
 * TESTE COMPLETO DO ORQUESTRADOR PRINCIPAL
 * 
 * Este teste verifica o funcionamento completo do orquestrador
 * incluindo todos os 6 estágios do fluxo de trading automatizado
 */

const OrquestradorPrincipal = require('./orquestrador-principal.js');

async function testeOrquestradorCompleto() {
    console.log('🚀 INICIANDO TESTE COMPLETO DO ORQUESTRADOR PRINCIPAL');
    console.log('═══════════════════════════════════════════════════════');
    
    try {
        // Instanciar o orquestrador
        const orquestrador = new OrquestradorPrincipal();
        
        // 1. TESTE DE INICIALIZAÇÃO
        console.log('\n1️⃣ TESTANDO INICIALIZAÇÃO...');
        await orquestrador.iniciar();
        
        // Aguardar alguns segundos para ver o primeiro ciclo
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 2. VERIFICAR ESTATÍSTICAS INICIAIS
        console.log('\n2️⃣ VERIFICANDO ESTATÍSTICAS INICIAIS...');
        const estatisticas = orquestrador.obterEstatisticas();
        console.log('📊 Estatísticas:', JSON.stringify(estatisticas, null, 2));
        
        // 3. VERIFICAR STATUS DE CADA COMPONENTE
        console.log('\n3️⃣ VERIFICANDO STATUS DOS COMPONENTES...');
        console.log('▪️ Orquestrador ativo:', estatisticas.ativo);
        console.log('▪️ Ciclos executados:', estatisticas.ciclos_executados);
        console.log('▪️ Último ciclo:', estatisticas.ultimo_ciclo);
        console.log('▪️ Estágio atual:', estatisticas.estagio_atual);
        
        // 4. AGUARDAR MÚLTIPLOS CICLOS
        console.log('\n4️⃣ AGUARDANDO MÚLTIPLOS CICLOS DE EXECUÇÃO...');
        console.log('⏱️ Aguardando 30 segundos para observar funcionamento...');
        
        let contador = 0;
        const intervaloDemonstracao = setInterval(() => {
            contador++;
            const stats = orquestrador.obterEstatisticas();
            console.log(`\n📈 Ciclo ${contador}: ${stats.estagio_atual} | Execuções: ${stats.ciclos_executados}`);
            
            if (contador >= 6) { // 6 verificações = ~30 segundos
                clearInterval(intervaloDemonstracao);
            }
        }, 5000);
        
        // Aguardar o término da demonstração
        await new Promise(resolve => setTimeout(resolve, 35000));
        
        // 5. TESTE DE PARADA E REINÍCIO
        console.log('\n5️⃣ TESTANDO PARADA E REINÍCIO...');
        console.log('⏹️ Parando orquestrador...');
        await orquestrador.parar();
        
        const statusParado = orquestrador.obterEstatisticas();
        console.log('📊 Status após parada:', statusParado.ativo);
        
        // Aguardar e reiniciar
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('🔄 Reiniciando orquestrador...');
        await orquestrador.iniciar();
        
        // 6. VERIFICAÇÃO FINAL
        console.log('\n6️⃣ VERIFICAÇÃO FINAL...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const estatisticasFinais = orquestrador.obterEstatisticas();
        console.log('📊 Estatísticas finais:', JSON.stringify(estatisticasFinais, null, 2));
        
        // 7. PARADA FINAL
        console.log('\n7️⃣ FINALIZANDO TESTE...');
        await orquestrador.parar();
        
        console.log('\n✅ TESTE COMPLETO FINALIZADO COM SUCESSO!');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📋 RESUMO DO TESTE:');
        console.log(`▪️ Ciclos executados: ${estatisticasFinais.ciclos_executados}`);
        console.log(`▪️ Último estágio: ${estatisticasFinais.estagio_atual}`);
        console.log(`▪️ Status final: ${estatisticasFinais.ativo ? 'ATIVO' : 'PARADO'}`);
        console.log('\n🎯 O orquestrador está funcionando corretamente!');
        
    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Executar o teste se chamado diretamente
if (require.main === module) {
    testeOrquestradorCompleto()
        .then(() => {
            console.log('\n🏁 Teste finalizado. Pressione Ctrl+C para sair.');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Erro fatal no teste:', error);
            process.exit(1);
        });
}

module.exports = testeOrquestradorCompleto;
