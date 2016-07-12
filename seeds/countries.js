exports.seed = function(knex, Promise) {
  var json = JSON.parse(require('fs').readFileSync(__dirname + '/data/countries.json', 'utf8'));
  return knex('countries').insert(
    json
  );
};
