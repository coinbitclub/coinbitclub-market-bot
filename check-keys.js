const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        const result = await pool.query("SELECT api_key, secret_key FROM user_api_keys WHERE exchange = 'bybit' LIMIT 1");
        if (result.rows.length > 0) {
            console.log('API Key completa:', result.rows[0].api_key);
            console.log('Secret completa:', result.rows[0].secret_key);
            console.log('Tamanho API Key:', result.rows[0].api_key.length);
            console.log('Tamanho Secret:', result.rows[0].secret_key.length);
        }
    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await pool.end();
    }
})();
