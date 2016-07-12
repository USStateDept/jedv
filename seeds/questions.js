exports.seed = function(knex, Promise) {
  var json = JSON.parse(require('fs').readFileSync(__dirname + '/data/questions.json', 'utf8'));
  return knex('questions').insert(
    json
  );
};
