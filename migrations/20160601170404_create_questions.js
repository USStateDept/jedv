
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('questions', function (t) {
      t.increments('id').primary();
      t.integer('input_type_id');
      t.integer('option_group_id').references('option_groups.id');
      t.integer('feedback_id').references('feedback.id');
      t.string('question_name');
      t.string('question_text');
      t.string('question_description');
      t.boolean('question_required');
      t.boolean('answer_required');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('questions');
};
