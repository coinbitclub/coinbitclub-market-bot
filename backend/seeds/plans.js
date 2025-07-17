export async function seed(knex) {
  await knex('plans').insert({ id: knex.raw('gen_random_uuid()'), name: 'Free', price_id: 'free', currency: 'USD', unit_amount: 0 });
}
