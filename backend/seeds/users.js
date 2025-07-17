export async function seed(knex) {
  await knex('users').insert({ id: knex.raw('gen_random_uuid()'), email: 'admin@example.com', password_hash: 'hash', role: 'admin' });
}
