
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('question_options', function (t) {
      t.increments('id').primary();
      t.integer('question_id').notNullable();
      t.integer('option_choice_id');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('question_options');
};
