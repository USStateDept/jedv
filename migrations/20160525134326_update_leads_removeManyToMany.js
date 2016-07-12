
exports.up = function(knex, Promise) {
  return knex.schema.table('leads', function (table) {
    table
        .dropColumn("country_id")
        .dropColumn("region_id")
        .dropColumn("sector_id")
        .dropColumn("country")
        .dropColumn("specific_location")
  });
};

exports.down = function(knex, Promise) {
  
};
