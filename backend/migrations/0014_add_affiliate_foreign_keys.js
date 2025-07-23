export async function up(knex) {
  // Adicionar chave estrangeira para affiliate_id na tabela users se não existir
  const hasColumn = await knex.schema.hasColumn('users', 'affiliate_id');
  if (!hasColumn) {
    await knex.schema.alterTable('users', (table) => {
      table.integer('affiliate_id').unsigned().nullable();
      table.foreign('affiliate_id').references('id').inTable('affiliates').onDelete('SET NULL');
    });
  }
}

export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'affiliate_id');
  if (hasColumn) {
    await knex.schema.alterTable('users', (table) => {
      table.dropForeign(['affiliate_id']);
      table.dropColumn('affiliate_id');
    });
  }
}
