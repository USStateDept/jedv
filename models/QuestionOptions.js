var bookshelf    = require("../config/settings.js");
var Question = require("./Questions.js");
var OptionChoice = require("./OptionChoices.js");

var QuestionOption = bookshelf.db.Model.extend({
  tableName: 'question_options',
  question: function(){
    return this.belongsTo(Question);
  },
  optionChoice: function(){
    return this.belongsTo(OptionChoice);
  }
});

module.exports = bookshelf.db.model('QuestionOption', QuestionOption);
