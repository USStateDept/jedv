
exports.up = function(knex, Promise) {
  return knex.schema.table('leads', function (table) {
    table
        .dropColumn("us_firm_contact")
        .dropColumn("us_firm_wins")
        .boolean('editable');
  });
};

exports.down = function(knex, Promise) {
  
};
