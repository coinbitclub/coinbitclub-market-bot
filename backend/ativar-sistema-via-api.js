#!/usr/bin/env node

/**
 * 🟢 ATIVADOR DO SISTEMA VIA API
 * 
 * Este script ativa o sistema usando o endpoint da API do sistema
 * É uma alternativa ao orquestrador-mestre.js que não existe
 */

const axios = require('axios');

async function ativarSistemaViaAPI() {
    try {
        console.log('🟢 Iniciando ativação do sistema via API...');

        // Tentar ativar o sistema usando o endpoint POST /api/system/start
        const response = await axios.post('http://localhost:3000/api/system/start', {}, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Sistema-Ativador/1.0'
            }
        });

        if (response.data.success) {
            console.log('✅ Sistema ativado com sucesso via API!');
            console.log('📊 Status do sistema:', response.data.data);
            
            // Verificar status para confirmar
            const statusResponse = await axios.get('http://localhost:3000/api/system/status');
            console.log('📋 Verificação de status:', statusResponse.data.data);
            
            return true;
        } else {
            console.error('❌ Falha na ativação:', response.data.message);
            return false;
        }

    } catch (error) {
        console.error('❌ Erro ao ativar sistema via API:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 O servidor não está rodando. Inicie com: node server.js');
        }
        
        return false;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    ativarSistemaViaAPI()
        .then(success => {
            if (success) {
                console.log('🎉 Sistema ativado e pronto para receber sinais!');
                process.exit(0);
            } else {
                console.log('💥 Falha na ativação do sistema');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Erro fatal:', error);
            process.exit(1);
        });
}

module.exports = { ativarSistemaViaAPI };
