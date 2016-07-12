
exports.up = function(knex, Promise) {
  return knex.schema.table('leads', function (table) {
    table
        .dropColumn("dos_region")
        .dropColumn("sector");
  });
};

exports.down = function(knex, Promise) {

};
