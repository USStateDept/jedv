
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('countries', function (t) {
      t.increments('id').primary();
      t.string('sovereignt').notNullable();
      t.string('geounit').notNullable();
      t.string('dos_region');
      t.string('iso_a2');
      t.string('iso_a3');
      t.string('website');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('countries');
};
