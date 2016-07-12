
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('input_types', function (t) {
      t.increments('id').primary();
      t.string('input_type_name');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('input_types');
};
