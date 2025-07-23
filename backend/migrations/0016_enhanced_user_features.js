export async function up(knex) {
  // Adicionar recursos avançados de usuário
  const userColumns = await knex.raw("PRAGMA table_info(users)");
  const userColumnNames = userColumns.map(col => col.name);
  
  await knex.schema.alterTable('users', (table) => {
    if (!userColumnNames.includes('email_verified_at')) {
      table.timestamp('email_verified_at');
    }
    if (!userColumnNames.includes('two_factor_secret')) {
      table.string('two_factor_secret');
    }
    if (!userColumnNames.includes('password_reset_token')) {
      table.string('password_reset_token');
    }
    if (!userColumnNames.includes('password_reset_expires')) {
      table.timestamp('password_reset_expires');
    }
  });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('email_verified_at');
    table.dropColumn('two_factor_secret');
    table.dropColumn('password_reset_token');
    table.dropColumn('password_reset_expires');
  });
}
