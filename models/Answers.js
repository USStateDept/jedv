var bookshelf    = require("../config/settings.js");
require('./Questions.js');

var Answer = bookshelf.db.Model.extend({
  tableName: 'answers',
  question: function() {
    return this.belongsTo('Question', 'question_id');
  },
  feedbackResult: function() {
    return this.belongsTo('FeedbackResult', 'feedback_result_id');
  }
});

module.exports = bookshelf.db.model('Answer', Answer);
