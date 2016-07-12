exports.seed = function(knex, Promise) {
  var json = JSON.parse(require('fs').readFileSync(__dirname + '/data/leads_countries.json', 'utf8'));
  return knex('leads_countries').insert(
    json
  );
};
