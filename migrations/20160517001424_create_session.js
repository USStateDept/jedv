
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('session', function (t) {
      t.string('sid').primary();
      t.json('sess').notNullable();
      t.timestamp('expire');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('session');
};
