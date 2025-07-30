const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function verificarECorrigirTabela() {
  try {
    console.log('🔍 VERIFICANDO E CORRIGINDO ESTRUTURA DA TABELA user_api_keys');
    console.log('=' .repeat(70));
    
    // 1. Verificar estrutura atual da tabela
    console.log('📋 1. Verificando estrutura atual...');
    
    const estruturaAtual = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_api_keys' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Colunas atuais da tabela user_api_keys:');
    estruturaAtual.rows.forEach(col => {
      console.log(`   📋 ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });
    
    // 2. Verificar se a coluna last_validated existe
    const temLastValidated = estruturaAtual.rows.some(col => col.column_name === 'last_validated');
    
    if (!temLastValidated) {
      console.log('\n🔧 2. Adicionando coluna last_validated...');
      
      await pool.query(`
        ALTER TABLE user_api_keys 
        ADD COLUMN IF NOT EXISTS last_validated TIMESTAMP DEFAULT NULL
      `);
      
      console.log('✅ Coluna last_validated adicionada com sucesso!');
    } else {
      console.log('\n✅ 2. Coluna last_validated já existe!');
    }
    
    // 3. Verificar dados atuais das usuárias VIP
    console.log('\n📊 3. Verificando dados atuais das usuárias VIP...');
    
    const usuariasVip = await pool.query(`
      SELECT u.id, u.name, u.email,
             uak.api_key, uak.secret_key, uak.exchange, 
             uak.is_active, uak.validation_status,
             uak.created_at, uak.updated_at
      FROM users u
      LEFT JOIN user_api_keys uak ON u.id = uak.user_id
      WHERE u.name IN ('Luiza Maria de Almeida Pinto', 'Érica dos Santos', 'PALOMA AMARAL')
      ORDER BY u.id
    `);
    
    console.log(`✅ Encontradas ${usuariasVip.rows.length} usuárias VIP:`);
    
    usuariasVip.rows.forEach((usuario, index) => {
      console.log(`\n${index + 1}. ${usuario.name} (ID: ${usuario.id})`);
      console.log(`   📧 Email: ${usuario.email}`);
      console.log(`   🔑 API Key: ${usuario.api_key || 'NÃO CONFIGURADA'}`);
      console.log(`   🔐 Secret: ${usuario.secret_key ? usuario.secret_key.substring(0, 8) + '...' : 'NÃO CONFIGURADO'}`);
      console.log(`   📊 Status: ${usuario.validation_status || 'N/A'}`);
      console.log(`   ✅ Ativa: ${usuario.is_active || false}`);
    });
    
    // 4. Verificar chaves nas imagens vs banco
    console.log('\n🔍 4. COMPARANDO CHAVES DAS IMAGENS VS BANCO...');
    
    const chavesImagens = [
      {
        nome: 'Luiza Maria',
        api_key_imagem: 'JuCpekqnmMsL4QqbKG',
        secret_imagem: 'gRqMLJnfRLMnE3Hh0QkxHKDxE1DQWjPKF4Py'
      },
      {
        nome: 'Érica dos Santos',
        api_key_imagem: 'rg1HWyxETWwbzJGew',
        secret_imagem: 'g0Gr9hokGvFDE0CSFyndZr0EBXryA1nmRd'
      },
      {
        nome: 'Paloma Amaral',
        api_key_imagem: 'DxFAJPo5KQQIg5Enq',
        secret_imagem: '6OGy9hokGvF3EBOCSPynczOEBXnyA1nmR4'
      }
    ];
    
    for (const chaveImagem of chavesImagens) {
      const usuarioBanco = usuariasVip.rows.find(u => 
        u.name.toLowerCase().includes(chaveImagem.nome.toLowerCase().split(' ')[0])
      );
      
      if (usuarioBanco) {
        console.log(`\n🔍 ${chaveImagem.nome}:`);
        console.log(`   🖼️ Chave da imagem: ${chaveImagem.api_key_imagem}`);
        console.log(`   💾 Chave do banco:  ${usuarioBanco.api_key || 'NENHUMA'}`);
        console.log(`   🖼️ Secret da imagem: ${chaveImagem.secret_imagem.substring(0, 8)}...`);
        console.log(`   💾 Secret do banco:  ${usuarioBanco.secret_key ? usuarioBanco.secret_key.substring(0, 8) + '...' : 'NENHUMA'}`);
        
        // Verificar se as chaves são diferentes
        if (usuarioBanco.api_key !== chaveImagem.api_key_imagem || 
            usuarioBanco.secret_key !== chaveImagem.secret_imagem) {
          
          console.log(`   ⚠️ DIFERENÇA DETECTADA! Atualizando com chaves das imagens...`);
          
          await pool.query(`
            UPDATE user_api_keys 
            SET api_key = $1,
                secret_key = $2,
                validation_status = 'pending',
                updated_at = NOW()
            WHERE user_id = $3
          `, [chaveImagem.api_key_imagem, chaveImagem.secret_imagem, usuarioBanco.id]);
          
          console.log(`   ✅ Chaves atualizadas no banco!`);
        } else {
          console.log(`   ✅ Chaves já estão corretas no banco!`);
        }
      }
    }
    
    // 5. Verificar estrutura final
    console.log('\n📊 5. ESTRUTURA FINAL DA TABELA:');
    
    const estruturaFinal = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_api_keys' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Estrutura final da tabela user_api_keys:');
    estruturaFinal.rows.forEach(col => {
      console.log(`   📋 ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });
    
    // 6. Verificar dados finais
    console.log('\n👑 6. DADOS FINAIS DAS USUÁRIAS VIP:');
    
    const dadosFinais = await pool.query(`
      SELECT u.id, u.name, u.email,
             uak.api_key, uak.secret_key, uak.validation_status,
             uak.is_active, uak.last_validated
      FROM users u
      INNER JOIN user_api_keys uak ON u.id = uak.user_id
      WHERE u.name IN ('Luiza Maria de Almeida Pinto', 'Érica dos Santos', 'PALOMA AMARAL')
      ORDER BY u.id
    `);
    
    dadosFinais.rows.forEach((usuario, index) => {
      console.log(`\n${index + 1}. ${usuario.name}`);
      console.log(`   🔑 API Key: ${usuario.api_key}`);
      console.log(`   🔐 Secret: ${usuario.secret_key.substring(0, 8)}...`);
      console.log(`   📊 Status: ${usuario.validation_status}`);
      console.log(`   ✅ Ativa: ${usuario.is_active}`);
      console.log(`   🕐 Última validação: ${usuario.last_validated || 'Nunca'}`);
    });
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ ESTRUTURA DA TABELA VERIFICADA E CORRIGIDA!');
    console.log('🔑 CHAVES ATUALIZADAS COM DADOS DAS IMAGENS!');
    console.log('=' .repeat(70));
    
    // 7. Mostrar possíveis problemas com as chaves
    console.log('\n🔍 7. ANÁLISE DOS PROBLEMAS COM AS CHAVES API:');
    console.log('');
    console.log('❌ Problema identificado: "API key is invalid"');
    console.log('');
    console.log('🎯 POSSÍVEIS CAUSAS:');
    console.log('   1. ⚠️ Chaves podem ter sido desabilitadas no painel Bybit');
    console.log('   2. ⚠️ Chaves podem ter permissões insuficientes');
    console.log('   3. ⚠️ IP pode não estar na whitelist (se configurado)');
    console.log('   4. ⚠️ Chaves podem ter expirado');
    console.log('   5. ⚠️ Conta pode estar restrita/suspensa');
    console.log('');
    console.log('🔧 SOLUÇÕES RECOMENDADAS:');
    console.log('   1. ✅ Verificar se as chaves estão ativas no painel Bybit');
    console.log('   2. ✅ Verificar permissões das chaves (Trading, Account Info)');
    console.log('   3. ✅ Verificar se há restrições de IP');
    console.log('   4. ✅ Regenerar as chaves se necessário');
    console.log('   5. ✅ Confirmar status da conta');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão com banco fechada');
  }
}

// Executar verificação
verificarECorrigirTabela().catch(console.error);
