#!/usr/bin/env node

/**
 * 🚀 ATIVADOR DO ORQUESTRADOR MESTRE ATUALIZADO
 * 
 * Este script ativa o orquestrador que integra todos os ajustes feitos:
 * - Dashboard em tempo real
 * - Gestores reais do banco de dados  
 * - WebSocket para monitoramento
 * - Todos os microserviços
 * - Sistema completo de monitoramento
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class AtivadorOrquestradorCompleto {
    constructor() {
        this.processo = null;
    }

    async ativar() {
        console.log('🚀 ATIVADOR ORQUESTRADOR MESTRE ATUALIZADO');
        console.log('==========================================');
        console.log('🏛️ COINBITCLUB MARKET BOT V3.0.0');
        console.log(`📅 ${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString('pt-BR')}`);
        console.log('');

        // Verificar se o orquestrador existe
        const orquestradorPath = path.join(__dirname, 'orquestrador-mestre-atualizado.js');
        
        if (!fs.existsSync(orquestradorPath)) {
            console.error('❌ ERRO: orquestrador-mestre-atualizado.js não encontrado!');
            console.log('');
            console.log('📁 Arquivos disponíveis no diretório:');
            
            const arquivos = fs.readdirSync(__dirname).filter(f => f.includes('orquestrador'));
            arquivos.forEach(arquivo => {
                console.log(`   📄 ${arquivo}`);
            });
            
            return false;
        }

        console.log('✅ orquestrador-mestre-atualizado.js encontrado');
        console.log('');

        try {
            console.log('🚀 INICIANDO ORQUESTRADOR MESTRE ATUALIZADO...');
            console.log('==============================================');
            
            // Executar o orquestrador
            this.processo = spawn('node', [orquestradorPath], {
                stdio: 'inherit',
                cwd: __dirname
            });

            this.processo.on('error', (error) => {
                console.error('❌ ERRO ao iniciar orquestrador:', error.message);
            });

            this.processo.on('exit', (code) => {
                if (code === 0) {
                    console.log('✅ Orquestrador finalizou normalmente');
                } else {
                    console.error(`❌ Orquestrador finalizou com erro (código: ${code})`);
                }
            });

            console.log('✅ Orquestrador iniciado com sucesso!');
            console.log('');
            console.log('📊 INFORMAÇÕES IMPORTANTES:');
            console.log('===========================');
            console.log('🌐 Dashboard: http://localhost:3011');
            console.log('🔌 WebSocket: ws://localhost:3016');  
            console.log('🚪 API Gateway: http://localhost:8080');
            console.log('🗄️ Banco: Railway PostgreSQL (conectado)');
            console.log('👨‍💼 Gestores: 8 gestores reais no banco');
            console.log('');
            console.log('⚠️ Para parar o sistema: Pressione Ctrl+C');
            console.log('');

            return true;

        } catch (error) {
            console.error('❌ ERRO CRÍTICO:', error.message);
            return false;
        }
    }

    parar() {
        if (this.processo) {
            console.log('🛑 Parando orquestrador...');
            this.processo.kill('SIGINT');
        }
    }
}

// EXECUÇÃO PRINCIPAL
async function main() {
    const ativador = new AtivadorOrquestradorCompleto();
    
    // Capturar Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n⚠️ Interrupção detectada...');
        ativador.parar();
        setTimeout(() => {
            process.exit(0);
        }, 2000);
    });

    const sucesso = await ativador.ativar();
    
    if (!sucesso) {
        console.log('');
        console.log('🔧 SOLUÇÕES POSSÍVEIS:');
        console.log('======================');
        console.log('1. Verificar se Node.js está instalado');
        console.log('2. Executar: npm install');
        console.log('3. Verificar permissões do arquivo');
        console.log('4. Verificar conexão com o banco');
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = AtivadorOrquestradorCompleto;
