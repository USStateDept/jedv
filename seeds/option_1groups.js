exports.seed = function(knex, Promise) {
  var json = JSON.parse(require('fs').readFileSync(__dirname + '/data/option_groups.json', 'utf8'));
  return knex('option_groups').insert(
    json
  );
};
