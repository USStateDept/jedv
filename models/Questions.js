/*
################################
# Feedback model for bookshelf ORM
################################

*/

var bookshelf    = require("../config/settings.js");
var InputType    = require("./InputTypes.js");
var OptionChoices = require("./OptionChoices.js");
var QuestionOptions = require("./QuestionOptions.js");
var OptionGroup = require("./OptionGroups.js");
var Answer = require('./Answers');
require("./Feedbacks.js");

var Question = bookshelf.db.Model.extend({
  tableName: 'questions',
  feedback: function() {
    return this.belongsTo('Feedback');
  },
  inputType: function() {
    return this.belongsTo(InputType);
  },
  optionGroup: function() {
    return this.belongsTo(OptionGroup);
  },
  optionChoices: function(){
    return this.belongsToMany(OptionChoices).through(QuestionOptions);
  },
  answers: function(){
    return this.hasMany(Answer);
  }
});

module.exports = bookshelf.db.model('Question', Question);
