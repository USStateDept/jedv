exports.seed = function(knex, Promise) {
  var json = JSON.parse(require('fs').readFileSync(__dirname + '/data/leads.json', 'utf8'));
  return knex('leads').insert(
    json
  );
};
