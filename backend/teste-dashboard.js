const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = 3012; // Porta diferente para teste

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: { rejectUnauthorized: false }
});

app.get('/', async (req, res) => {
  try {
    console.log('🔍 Testando query corrigida...');
    
    // Testar query simples primeiro
    const usuarios = await pool.query('SELECT COUNT(*) as total FROM users');
    console.log(`👥 Total usuários: ${usuarios.rows[0].total}`);
    
    // Testar query dos gestores
    const gestores = await pool.query(`
      SELECT name, email, status 
      FROM users 
      WHERE name IN (
        'signals_manager', 'operations_manager', 'fear_greed_manager',
        'financial_supervisor', 'trade_supervisor', 'users_manager',
        'risk_manager', 'analytics_manager'
      )
      ORDER BY name
    `);
    
    console.log(`🎯 Gestores encontrados: ${gestores.rows.length}`);
    
    res.json({
      status: 'OK',
      timestamp: new Date(),
      total_usuarios: usuarios.rows[0].total,
      gestores_encontrados: gestores.rows.length,
      gestores: gestores.rows,
      message: 'Query corrigida funcionando!'
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({
      status: 'ERRO',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🧪 Teste do Dashboard na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  
  // Fazer teste automático
  setTimeout(() => {
    console.log('🔄 Executando teste automático...');
    
    pool.query('SELECT COUNT(*) FROM users').then(result => {
      console.log(`✅ Conexão OK - ${result.rows[0].count} usuários`);
    }).catch(err => {
      console.error(`❌ Erro de conexão: ${err.message}`);
    });
  }, 1000);
});
