
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('sectors', function (t) {
      t.increments('id').primary();
      t.string('sector').unique();
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('sectors');
};
