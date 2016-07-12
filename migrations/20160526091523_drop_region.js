
exports.up = function(knex, Promise) {
  return knex.schema.dropTable('regions');
};

exports.down = function(knex, Promise) {

};
