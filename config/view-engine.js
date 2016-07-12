var nunjucks = require('nunjucks');

var initViewEngine = function(app, path) {

  var env = nunjucks.configure((path + '/views'), {
      autoescape: true,
      express: app
  });

  return env;

};

module.exports = initViewEngine;