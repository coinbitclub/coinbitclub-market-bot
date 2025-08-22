require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

db.query(`SELECT unnest(enum_range(NULL::position_status)) as valid_values`)
  .then(r => { 
    console.log('Valores válidos para position_status:'); 
    r.rows.forEach(row => console.log('-', row.valid_values)); 
    db.end(); 
  })
  .catch(console.error);
