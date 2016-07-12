
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('subscriptions', function (t) {
      t.increments('id').primary();
      t.string('title').notNullable();
      t.string('last_results_hash').notNullable();
      t.integer('frequency').notNullable().defaultTo(1);
      t.timestamp('contacted_at').notNullable();
      t.string('email');
      t.json('filters');
      t.timestamps();
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('subscriptions');
};
