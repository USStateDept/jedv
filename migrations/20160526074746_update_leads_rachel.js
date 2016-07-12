
exports.up = function(knex, Promise) {
  return knex.schema.table('leads', function (table) {
    table
        .dropColumn("project_funding_source")
        .dropColumn("borrowing_entity")
        .dropColumn("status")
  });
};

exports.down = function(knex, Promise) {
  
};
