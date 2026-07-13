/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('accessories', (table) => {
    table.uuid('id').primary();
    table
      .uuid('car_id')
      .notNullable()
      .references('id')
      .inTable('cars')
      .onDelete('CASCADE');
    table.string('description').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Defesa extra no banco contra acessórios duplicados no mesmo carro
    // (a checagem "case-insensitive" fica a cargo da camada de aplicação).
    table.unique(['car_id', 'description']);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('accessories');
};
