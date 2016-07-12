
exports.up = function(knex, Promise) {
  return knex.schema.dropTable('leads_regions')
};

exports.down = function(knex, Promise) {
  
};

