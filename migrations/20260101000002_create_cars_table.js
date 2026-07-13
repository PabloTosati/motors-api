/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('cars', (table) => {
    table.uuid('id').primary();
    table.string('model').notNullable();
    table.string('color').notNullable();
    table.integer('year').notNullable();
    table.decimal('value_per_day', 10, 2).notNullable();
    table.integer('number_of_passengers').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.check('?? between 1950 and 2023', ['year']);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('cars');
};
