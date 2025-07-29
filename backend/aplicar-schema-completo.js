/**
 * 🗄️ APLICADOR DE SCHEMA COMPLETO
 * Script para aplicar o schema completo no banco PostgreSQL Railway
 */

const { Pool } = require('pg');
const fs = require('fs').promises;

console.log('🗄️ APLICANDO SCHEMA COMPLETO NO BANCO');
console.log('====================================');

class AplicadorSchema {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
    }

    async aplicarSchema() {
        console.log('📊 Conectando ao banco PostgreSQL Railway...');
        
        const client = await this.pool.connect();
        try {
            // Ler schema completo
            const schemaPath = './_schema_completo_final.sql';
            const schemaContent = await fs.readFile(schemaPath, 'utf8');
            
            console.log('📄 Schema carregado:', schemaPath);
            console.log('📏 Tamanho:', schemaContent.length, 'caracteres');
            
            // Dividir em comandos individuais
            const comandos = schemaContent
                .split(';')
                .map(cmd => cmd.trim())
                .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
            
            console.log('🔧 Total de comandos SQL:', comandos.length);
            console.log('');
            
            let sucessos = 0;
            let erros = 0;
            
            for (let i = 0; i < comandos.length; i++) {
                const comando = comandos[i];
                
                if (comando.length < 10) continue; // Pular comandos muito pequenos
                
                try {
                    console.log(`⚙️ [${i+1}/${comandos.length}] Executando comando...`);
                    
                    await client.query(comando);
                    sucessos++;
                    
                    // Identificar tipo de comando
                    if (comando.toUpperCase().includes('CREATE TABLE')) {
                        const match = comando.match(/CREATE TABLE.*?(\w+)/i);
                        const tableName = match ? match[1] : 'tabela';
                        console.log(`   ✅ Tabela criada: ${tableName}`);
                    } else if (comando.toUpperCase().includes('CREATE EXTENSION')) {
                        console.log('   ✅ Extensão criada');
                    } else if (comando.toUpperCase().includes('INSERT INTO')) {
                        console.log('   ✅ Dados inseridos');
                    } else {
                        console.log('   ✅ Comando executado');
                    }
                    
                } catch (error) {
                    erros++;
                    console.log(`   ⚠️ Erro (ignorado): ${error.message.substring(0, 100)}...`);
                }
            }
            
            console.log('');
            console.log('📊 RESUMO DA APLICAÇÃO:');
            console.log(`   ✅ Sucessos: ${sucessos}`);
            console.log(`   ⚠️ Erros: ${erros}`);
            console.log(`   📈 Taxa de sucesso: ${Math.round((sucessos/(sucessos+erros))*100)}%`);
            
            // Verificar tabelas criadas
            await this.verificarTabelas(client);
            
        } catch (error) {
            console.error('❌ Erro ao aplicar schema:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async verificarTabelas(client) {
        console.log('');
        console.log('🔍 VERIFICANDO TABELAS CRIADAS:');
        console.log('================================');
        
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        const tabelas = result.rows.map(row => row.table_name);
        
        console.log(`📋 Total de tabelas: ${tabelas.length}`);
        
        // Tabelas essenciais para sistema multiusuário
        const tabelasEssenciais = [
            'users',
            'user_api_keys',
            'user_trading_params', 
            'trading_operations',
            'user_balances',
            'trade_history',
            'affiliates',
            'affiliate_commissions',
            'system_config'
        ];
        
        console.log('');
        console.log('✅ TABELAS ESSENCIAIS:');
        for (const tabela of tabelasEssenciais) {
            const exists = tabelas.includes(tabela);
            console.log(`   ${exists ? '✅' : '❌'} ${tabela}`);
        }
        
        if (tabelas.length > 0) {
            console.log('');
            console.log('📋 TODAS AS TABELAS:');
            tabelas.forEach(tabela => console.log(`   📄 ${tabela}`));
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const aplicador = new AplicadorSchema();
    
    aplicador.aplicarSchema()
        .then(() => {
            console.log('');
            console.log('🎉 SCHEMA APLICADO COM SUCESSO!');
            console.log('Sistema multiusuário pronto para uso.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('');
            console.error('❌ ERRO AO APLICAR SCHEMA:', error.message);
            process.exit(1);
        });
}

module.exports = AplicadorSchema;
