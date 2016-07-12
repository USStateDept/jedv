
exports.up = function(knex, Promise) {
  return knex.schema.table('leads', function (table) {
    table
        .dropColumn("timestamp")
        .dropColumn("account_id");
  });
};

exports.down = function(knex, Promise) {

};
