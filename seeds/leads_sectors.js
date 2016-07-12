exports.seed = function(knex, Promise) {
  var json = JSON.parse(require('fs').readFileSync(__dirname + '/data/leads_sectors.json', 'utf8'));
  return knex('leads_sectors').insert(
    json
  );
};
