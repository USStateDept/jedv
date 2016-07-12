
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('feedback', function (t) {
      t.increments('id').primary();
      t.string('feedback_type');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('feedback');
};
