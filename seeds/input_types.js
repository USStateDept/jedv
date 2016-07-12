exports.seed = function(knex, Promise) {
  var json = JSON.parse(require('fs').readFileSync(__dirname + '/data/input_types.json', 'utf8'));
  return knex('input_types').insert(
    json
  );
};
