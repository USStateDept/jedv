
exports.up = function(knex, Promise) {
  return knex.schema.table('accounts', function (table) {
    table.string("verification_token");
    table.boolean("is_verified");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('accounts', function (table) {
    table
        .dropColumn("verification_token")
        .dropColumn("is_verified");
  });
};
