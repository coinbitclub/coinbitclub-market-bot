import bcrypt from 'bcrypt';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export default async function seed(knex) {
  // Clear existing data
  await knex('users').del();
  
  // Hash passwords
  const adminPassword = await bcrypt.hash('Apelido22@', 12);
  const testPassword = await bcrypt.hash('test123!', 12);
  
  // Insert users
  await knex('users').insert([
    {
      id: 1,
      email: 'faleconosco@coinbitclub.vip',
      password_hash: adminPassword,
      name: 'ERICA ANDRADE',
      phone: null,
      role: 'admin',
      status: 'active',
      timezone: 'America/Sao_Paulo',
      language: 'pt',
      country: 'Brasil',
      is_admin: true,
      is_active: true,
      email_verified_at: knex.fn.now(),
      commission_rate: 0,
      email_notifications: true,
      sms_notifications: false,
      risk_tolerance: 'medium',
      max_concurrent_trades: 999
    },
    {
      id: 2,
      email: 'admin@coinbitclub.com',
      password_hash: testPassword,
      name: 'System Administrator',
      role: 'admin',
      status: 'active',
      country: 'Brazil',
      is_admin: true,
      is_active: true,
      email_verified_at: knex.fn.now()
    },
    {
      id: 3,
      email: 'test@coinbitclub.com',
      password_hash: testPassword,
      name: 'Test User',
      role: 'user',
      status: 'active',
      country: 'Brazil',
      is_admin: false,
      is_active: true,
      trial_ends_at: knex.raw("datetime('now', '+7 days')")
    },
    {
      id: 4,
      email: 'affiliate@coinbitclub.com',
      password_hash: testPassword,
      name: 'Test Affiliate',
      role: 'affiliate',
      status: 'active',
      country: 'Brazil',
      commission_rate: 15.00,
      is_admin: false,
      is_active: true,
      email_verified_at: knex.fn.now()
    }
  ]);
}
