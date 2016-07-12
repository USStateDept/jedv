var bookshelf    = require("../config/settings.js");
var Question = require("./Questions.js");
var QuestionOptions = require("./QuestionOptions.js");
var OptionGroup = require("./OptionGroups.js");

var OptionChoice = bookshelf.db.Model.extend({
  tableName: 'option_choices',
  questions: function(){
    return this.belongsToMany(Question).through(QuestionOptions);
  },
  optionGroup: function() {
    return this.belongsTo('OptionGroup', 'option_group_id');
  }
});

module.exports = bookshelf.db.model('OptionChoice', OptionChoice);
