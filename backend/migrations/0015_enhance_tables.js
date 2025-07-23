export async function up(knex) {
  // Adicionar colunas extras às tabelas existentes
  
  // Melhorar tabela users
  const userColumns = await knex.raw("PRAGMA table_info(users)");
  const userColumnNames = userColumns.map(col => col.name);
  
  await knex.schema.alterTable('users', (table) => {
    if (!userColumnNames.includes('phone')) {
      table.string('phone');
    }
    if (!userColumnNames.includes('country')) {
      table.string('country');
    }
    if (!userColumnNames.includes('last_login_at')) {
      table.timestamp('last_login_at');
    }
    if (!userColumnNames.includes('is_admin')) {
      table.boolean('is_admin').defaultTo(false);
    }
    if (!userColumnNames.includes('is_active')) {
      table.boolean('is_active').defaultTo(true);
    }
  });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('phone');
    table.dropColumn('country');
    table.dropColumn('last_login_at');
    table.dropColumn('is_admin');
    table.dropColumn('is_active');
  });
}
