export async function up(pgm) {
  pgm.addColumn('user_operations', {
    price: { type: 'numeric' }
  });
}

export async function down(pgm) {
  pgm.dropColumn('user_operations', 'price');
}
