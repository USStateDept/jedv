var bookshelf    = require("../config/settings.js");

require("./OptionChoices.js");
require("./Questions.js");

var OptionGroup = bookshelf.db.Model.extend({
  tableName: 'option_groups',

  questions: function() {
    return this.hasMany('Question');
  },
  optionChoices: function() {
    return this.hasMany('OptionChoice');
  }
});

module.exports = bookshelf.db.model('OptionGroup', OptionGroup);
