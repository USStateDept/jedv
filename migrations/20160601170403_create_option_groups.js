
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('option_groups', function (t) {
      t.increments('id').primary();
      t.string('option_group_name');
    });
};

exports.down = function(knex, Promise) {

};
