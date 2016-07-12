exports.seed = function(knex, Promise) {
  var json = JSON.parse(require('fs').readFileSync(__dirname + '/data/feedback.json', 'utf8'));
  return knex('feedback').insert(
    json
  );
};
