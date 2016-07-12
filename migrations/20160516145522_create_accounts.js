
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('accounts', function (t) {
      t.increments('id').primary();
      t.string('password').notNullable();
      t.string('email').notNullable().unique();
      t.string('role');
      t.timestamps();
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('accounts');
};
