/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.string('cpf', 11).notNullable().unique();
    table.date('birth').notNullable();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.string('cep', 8).notNullable();
    table.string('logradouro');
    table.string('complemento');
    table.string('bairro');
    table.string('localidade');
    table.string('uf', 2);
    table.boolean('qualified').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('users');
};
