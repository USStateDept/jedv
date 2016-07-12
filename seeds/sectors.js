exports.seed = function(knex, Promise) {
  var json = JSON.parse(require('fs').readFileSync(__dirname + '/data/sectors.json', 'utf8'));
  return knex('sectors').insert(
    json
  );
};
