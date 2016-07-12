
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('leads_sectors', function (t) {
      t.increments('id').primary();
      t.integer('lead_fid').notNullable();
      t.integer('sector_id').notNullable();
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('leads_sectors');
};
