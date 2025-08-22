const { Client } = require('pg');

console.log('🔌 Testando conexão...');

const client = new Client({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

client.connect()
  .then(() => {
    console.log('✅ Conectado!');
    return client.query('SELECT NOW() as time, COUNT(*) as count FROM system_metrics');
  })
  .then(result => {
    console.log('⏰ Hora:', result.rows[0].time);
    console.log('📊 Métricas existentes:', result.rows[0].count);
    return client.end();
  })
  .catch(error => {
    console.error('❌ Erro:', error.message);
    client.end();
  });
