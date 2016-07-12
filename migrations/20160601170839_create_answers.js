
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('answers', function (t) {
      t.increments('id').primary();
      t.text('answer_text');
      t.integer('question_id').references('questions.id');
      t.integer('feedback_result_id').references('feedback_results.id');
      t.timestamps();
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('answers');
};
