/*
################################
# Feedback model for bookshelf ORM
################################

*/

var bookshelf    = require("../config/settings.js");
require("./Questions.js");

var Feedback = bookshelf.db.Model.extend({
  tableName: 'feedback',
  questions: function() {
    return this.hasMany('Question');
  }
});

module.exports = bookshelf.db.model('Feedback', Feedback);
