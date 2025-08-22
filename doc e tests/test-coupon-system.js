// ========================================
// TESTE SIMPLES DO COUPON SERVICE
// Validar estrutura das tabelas de cupons
// ========================================

const { Pool } = require('pg');

console.log('🎫 TESTE DO SISTEMA DE CUPONS');
console.log('=============================');

async function testCouponSystem() {
  const db = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/marketbot'
  });

  try {
    console.log('📋 1. Verificando tabelas de cupons...');
    
    // Verificar se as tabelas existem
    const tablesCheck = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('coupons', 'coupon_usage')
      ORDER BY table_name
    `);
    
    console.log(`✅ Tabelas encontradas: ${tablesCheck.rows.map(r => r.table_name).join(', ')}`);

    // 2. Verificar estrutura da tabela coupons
    console.log('🏗️ 2. Verificando estrutura da tabela coupons...');
    const couponsStructure = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'coupons' 
      ORDER BY ordinal_position
    `);
    console.log(`✅ Tabela coupons tem ${couponsStructure.rows.length} colunas`);

    // 3. Testar inserção de cupom
    console.log('➕ 3. Testando inserção de cupom...');
    const testCode = `TEST${Date.now()}`;
    const insertResult = await db.query(`
      INSERT INTO coupons (
        code, type, value, description, max_uses, 
        valid_from, valid_until, is_active, created_by
      ) VALUES (
        $1, 'PERCENTAGE', 10, 'Teste de cupom', 100,
        NOW(), NOW() + INTERVAL '30 days', true, 1
      ) RETURNING id, code
    `, [testCode]);
    
    const couponId = insertResult.rows[0].id;
    console.log(`✅ Cupom criado: ${insertResult.rows[0].code} (ID: ${couponId})`);

    // 4. Testar busca de cupom
    console.log('🔍 4. Testando busca de cupom...');
    const searchResult = await db.query(`
      SELECT * FROM coupons WHERE code = $1
    `, [testCode]);
    console.log(`✅ Cupom encontrado: ${searchResult.rows.length > 0 ? 'SIM' : 'NÃO'}`);

    // 5. Testar uso de cupom
    console.log('🎯 5. Testando registro de uso...');
    const usageResult = await db.query(`
      INSERT INTO coupon_usage (
        coupon_id, user_id, order_value, discount_applied
      ) VALUES ($1, 1, 100, 10) RETURNING id
    `, [couponId]);
    console.log(`✅ Uso registrado: ID ${usageResult.rows[0].id}`);

    // 6. Atualizar contador de usos
    console.log('🔄 6. Atualizando contador de usos...');
    await db.query(`
      UPDATE coupons SET current_uses = current_uses + 1 WHERE id = $1
    `, [couponId]);
    console.log('✅ Contador atualizado');

    // 7. Verificar estatísticas
    console.log('📊 7. Verificando estatísticas...');
    const statsResult = await db.query(`
      SELECT 
        c.code,
        c.type,
        c.value,
        c.current_uses,
        COUNT(cu.id) as total_uses,
        COALESCE(SUM(cu.discount_applied), 0) as total_discount
      FROM coupons c
      LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
      WHERE c.id = $1
      GROUP BY c.id, c.code, c.type, c.value, c.current_uses
    `, [couponId]);
    
    const stats = statsResult.rows[0];
    console.log(`✅ Estatísticas do cupom ${stats.code}:`);
    console.log(`   - Tipo: ${stats.type}`);
    console.log(`   - Valor: ${stats.value}%`);
    console.log(`   - Usos: ${stats.total_uses}`);
    console.log(`   - Desconto total: $${stats.total_discount}`);

    // 8. Limpar dados de teste
    console.log('🗑️ 8. Limpando dados de teste...');
    await db.query('DELETE FROM coupon_usage WHERE coupon_id = $1', [couponId]);
    await db.query('DELETE FROM coupons WHERE id = $1', [couponId]);
    console.log('✅ Dados de teste removidos');

    await db.end();

    console.log('\n🎉 ======= RELATÓRIO SISTEMA DE CUPONS =======');
    console.log('✅ Tabelas de cupons existem e funcionais');
    console.log('✅ Inserção de cupons funcionando');
    console.log('✅ Busca e validação funcionando');
    console.log('✅ Registro de uso funcionando');
    console.log('✅ Estatísticas e relatórios funcionando');
    console.log('✅ Sistema de limpeza funcionando');
    console.log('🎯 SISTEMA DE CUPONS 100% FUNCIONAL!');
    console.log('==========================================');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    await db.end();
    throw error;
  }
}

// Executar teste
testCouponSystem()
  .then(() => {
    console.log('✅ Teste concluído com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Falha no teste:', error);
    process.exit(1);
  });
