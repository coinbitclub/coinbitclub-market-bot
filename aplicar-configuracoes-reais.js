// ATUALIZAÇÃO DAS CONFIGURAÇÕES REAIS DO SISTEMA MARKETBOT
const { Pool } = require('pg');

// Configuração do banco Railway
const DATABASE_URL = 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('🔧 APLICANDO CONFIGURAÇÕES REAIS DO SISTEMA MARKETBOT');
console.log('=' * 60);

// Configurações reais do sistema
const CONFIGURACOES_REAIS = {
  // Configurações padrão (default do admin)
  default: {
    alavancagem: 5,                    // 5x (max 10x personalizável)
    take_profit_multiplier: 3,         // 3x alavancagem = 15% (max 5x personalizável)
    stop_loss_multiplier: 2,           // 2x alavancagem = 10% (personalizável 2-4x)
    tamanho_posicao_percent: 30,       // 30% do saldo (personalizável 10%-50%)
    max_alavancagem: 10,
    max_take_profit_multiplier: 5,
    min_stop_loss_multiplier: 2,
    max_stop_loss_multiplier: 4,
    min_tamanho_posicao: 10,
    max_tamanho_posicao: 50
  }
};

async function aplicarConfiguracaoesReais() {
  try {
    const client = await pool.connect();
    
    console.log('\n📊 1. REMOVENDO CONFIGURAÇÕES SIMULADAS...');
    
    // Primeiro, vamos atualizar a estrutura da tabela para incluir as configurações reais
    await client.query(`
      -- Adicionar novas colunas se não existirem
      DO $$ 
      BEGIN
        -- Alavancagem
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes_trading' AND column_name='alavancagem') THEN
          ALTER TABLE configuracoes_trading ADD COLUMN alavancagem INTEGER DEFAULT 5;
        END IF;
        
        -- Take Profit como multiplicador da alavancagem
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes_trading' AND column_name='take_profit_multiplier') THEN
          ALTER TABLE configuracoes_trading ADD COLUMN take_profit_multiplier DECIMAL(3,1) DEFAULT 3.0;
        END IF;
        
        -- Stop Loss como multiplicador da alavancagem
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes_trading' AND column_name='stop_loss_multiplier') THEN
          ALTER TABLE configuracoes_trading ADD COLUMN stop_loss_multiplier DECIMAL(3,1) DEFAULT 2.0;
        END IF;
        
        -- Tamanho da posição como % do saldo
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes_trading' AND column_name='tamanho_posicao_percent') THEN
          ALTER TABLE configuracoes_trading ADD COLUMN tamanho_posicao_percent INTEGER DEFAULT 30;
        END IF;
        
        -- Configurações máximas permitidas
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes_trading' AND column_name='max_alavancagem') THEN
          ALTER TABLE configuracoes_trading ADD COLUMN max_alavancagem INTEGER DEFAULT 10;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes_trading' AND column_name='max_take_profit_multiplier') THEN
          ALTER TABLE configuracoes_trading ADD COLUMN max_take_profit_multiplier DECIMAL(3,1) DEFAULT 5.0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes_trading' AND column_name='max_stop_loss_multiplier') THEN
          ALTER TABLE configuracoes_trading ADD COLUMN max_stop_loss_multiplier DECIMAL(3,1) DEFAULT 4.0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes_trading' AND column_name='min_stop_loss_multiplier') THEN
          ALTER TABLE configuracoes_trading ADD COLUMN min_stop_loss_multiplier DECIMAL(3,1) DEFAULT 2.0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes_trading' AND column_name='max_tamanho_posicao') THEN
          ALTER TABLE configuracoes_trading ADD COLUMN max_tamanho_posicao INTEGER DEFAULT 50;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes_trading' AND column_name='min_tamanho_posicao') THEN
          ALTER TABLE configuracoes_trading ADD COLUMN min_tamanho_posicao INTEGER DEFAULT 10;
        END IF;
        
        -- Configuração personalizada (se diferente do default)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes_trading' AND column_name='configuracao_personalizada') THEN
          ALTER TABLE configuracoes_trading ADD COLUMN configuracao_personalizada BOOLEAN DEFAULT false;
        END IF;
        
      END $$;
    `);
    
    console.log('✅ Estrutura da tabela atualizada');
    
    console.log('\n🔧 2. APLICANDO CONFIGURAÇÕES REAIS...');
    
    // Atualizar todas as configurações existentes com os valores reais
    const config = CONFIGURACOES_REAIS.default;
    
    await client.query(`
      UPDATE configuracoes_trading SET
        -- Remover colunas antigas simuladas
        valor_operacao = NULL,
        stop_loss_percent = NULL,
        take_profit_percent = NULL,
        
        -- Aplicar configurações reais
        alavancagem = $1,
        take_profit_multiplier = $2,
        stop_loss_multiplier = $3,
        tamanho_posicao_percent = $4,
        max_alavancagem = $5,
        max_take_profit_multiplier = $6,
        max_stop_loss_multiplier = $7,
        min_stop_loss_multiplier = $8,
        max_tamanho_posicao = $9,
        min_tamanho_posicao = $10,
        configuracao_personalizada = false,
        updated_at = CURRENT_TIMESTAMP
    `, [
      config.alavancagem,
      config.take_profit_multiplier,
      config.stop_loss_multiplier,
      config.tamanho_posicao_percent,
      config.max_alavancagem,
      config.max_take_profit_multiplier,
      config.max_stop_loss_multiplier,
      config.min_stop_loss_multiplier,
      config.max_tamanho_posicao,
      config.min_tamanho_posicao
    ]);
    
    console.log('✅ Configurações reais aplicadas');
    
    console.log('\n📊 3. VERIFICANDO CONFIGURAÇÕES APLICADAS...');
    
    const result = await client.query(`
      SELECT 
        u.nome,
        u.saldo_disponivel,
        c.alavancagem,
        c.take_profit_multiplier,
        c.stop_loss_multiplier,
        c.tamanho_posicao_percent,
        c.max_alavancagem,
        c.configuracao_personalizada,
        -- Cálculos baseados nas configurações reais
        (c.alavancagem * c.take_profit_multiplier) as take_profit_percent_calculado,
        (c.alavancagem * c.stop_loss_multiplier) as stop_loss_percent_calculado,
        (u.saldo_disponivel * c.tamanho_posicao_percent / 100) as valor_posicao_calculado
      FROM usuarios u
      JOIN configuracoes_trading c ON u.id = c.usuario_id
      WHERE u.trading_ativo = true
      ORDER BY u.id
    `);
    
    console.log(`\n👥 Usuários com configurações reais aplicadas: ${result.rows.length}\n`);
    
    result.rows.forEach((user, index) => {
      console.log(`👤 USUÁRIO ${index + 1}: ${user.nome}`);
      console.log(`   💰 Saldo: $${Number(user.saldo_disponivel).toFixed(2)}`);
      console.log(`   ⚡ Alavancagem: ${user.alavancagem}x (max: ${user.max_alavancagem}x)`);
      console.log(`   🎯 Take Profit: ${user.take_profit_multiplier}x alavancagem = ${user.take_profit_percent_calculado}%`);
      console.log(`   🛡️ Stop Loss: ${user.stop_loss_multiplier}x alavancagem = ${user.stop_loss_percent_calculado}%`);
      console.log(`   📊 Tamanho Posição: ${user.tamanho_posicao_percent}% = $${Number(user.valor_posicao_calculado).toFixed(2)}`);
      console.log(`   🎨 Personalizada: ${user.configuracao_personalizada ? 'SIM' : 'NÃO (padrão admin)'}`);
      console.log('');
    });
    
    console.log('\n🔢 4. FÓRMULAS DE CÁLCULO IMPLEMENTADAS:');
    console.log('=' * 45);
    console.log('📐 Take Profit % = Alavancagem × Multiplicador TP');
    console.log('📐 Stop Loss % = Alavancagem × Multiplicador SL');
    console.log('📐 Valor Posição = Saldo × Tamanho Posição %');
    console.log('📐 Exemplo: 5x alavancagem × 3 = 15% Take Profit');
    console.log('📐 Exemplo: 5x alavancagem × 2 = 10% Stop Loss');
    console.log('📐 Exemplo: $1000 saldo × 30% = $300 por posição');
    
    console.log('\n🎛️ 5. LIMITES DE PERSONALIZAÇÃO:');
    console.log('=' * 35);
    console.log('⚡ Alavancagem: 1x a 10x');
    console.log('🎯 Take Profit: até 5x da alavancagem');
    console.log('🛡️ Stop Loss: 2x a 4x da alavancagem');
    console.log('📊 Tamanho Posição: 10% a 50% do saldo');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro durante aplicação:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar aplicação
console.log('🚀 Iniciando aplicação de configurações reais...\n');
aplicarConfiguracaoesReais()
  .then(() => {
    console.log('\n✅ CONFIGURAÇÕES REAIS APLICADAS COM SUCESSO!');
    console.log('🎯 Sistema agora usa as configurações corretas:');
    console.log('   • Alavancagem 5x (personalizável até 10x)');
    console.log('   • Take Profit 15% (3x alavancagem)');
    console.log('   • Stop Loss 10% (2x alavancagem)');
    console.log('   • Posição 30% do saldo (personalizável 10%-50%)');
    console.log('   • OBRIGATÓRIO: Todas operações com TP e SL');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Falha na aplicação:', error.message);
    process.exit(1);
  });
