
exports.up = function(knex, Promise) {
  return knex.schema.table('leads', function (table) {
    table
        .dropColumn("contact_timestamp")
  });
};

exports.down = function(knex, Promise) {
  
};
