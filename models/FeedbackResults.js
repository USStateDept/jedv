var bookshelf    = require("../config/settings.js");
var Answer = require("./Answers.js");

var FeedbackResult = bookshelf.db.Model.extend({
  tableName: 'feedback_results',
  answers: function(){
    return this.hasMany(Answer);
  }
});

module.exports = bookshelf.db.model('FeedbackResult', FeedbackResult);
