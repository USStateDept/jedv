/*
################################
# Feedback model for bookshelf ORM
################################

*/

var bookshelf    = require("../config/settings.js");
var Question     = require("./Questions.js").Question;

var InputType = bookshelf.db.Model.extend({
  tableName: 'input_types',
  question: function() {
    return this.hasMany(Question);
  }
});

module.exports = InputType;
