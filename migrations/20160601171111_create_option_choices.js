
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('option_choices', function (t) {
      t.increments('id').primary();
      t.integer('option_group_id').references('option_groups.id');
      t.string('option_choice_name');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('option_choices');
};
