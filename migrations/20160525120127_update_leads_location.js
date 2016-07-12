
exports.up = function(knex, Promise) {
  return knex.schema.table('leads', function (table) {
    table
        .dropColumn("lat")
        .dropColumn("lon")
        .json('locations')
  });
};

exports.down = function(knex, Promise) {
  
};
