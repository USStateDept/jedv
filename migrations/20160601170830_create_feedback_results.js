
exports.up = function(knex, Promise) {
  return knex.schema.createTable('feedback_results', function(t) {
    t.increments('id').primary();
    t.timestamp('created_at').notNullable();
  });
};

exports.down = function(knex, Promise) {

};
