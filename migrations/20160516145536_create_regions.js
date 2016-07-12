
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('regions', function (t) {
      t.increments('id').primary();
      t.string('region');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('regions');
};
