
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('leads', function (t) {
    t.increments('fid').primary();
    t.timestamp('timestamp');
    t.timestamp('contact_timestamp');
    t.string('lon');
    t.string('lat');
    t.text('country');
    t.text('specific_location');
    t.text('dos_region');
    t.text('project_title');
    t.string('project_number');
    t.string('sector');
    t.text('project_size');
    t.text('project_description',  ['longtext']);
    t.text('keyword');
    t.string('source');
    t.date('project_announced');
    t.date('tender_date');
    t.text('project_funding_source');
    t.text('borrowing_entity');
    t.text('implementing_entity');
    t.text('project_pocs');
    t.text('post_comments');
    t.string('submitting_officer');
    t.text('submitting_officer_contact');
    t.text('link_to_project');
    t.text('business_url');
    t.string('us_firm_contact');
    t.string('us_firm_wins');
    t.boolean('cleared');
    t.string('status');
    t.boolean('archived');
    t.integer('sector_id').notNullable().defaultTo(1);
    t.date('auto_archive_date');
    t.integer('country_id');
    t.integer('region_id');
    t.specificType('the_geom', 'geometry(POINT, 4326)');
    t.integer('account_id');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('leads');
};
