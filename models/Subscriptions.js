/*
################################
# Subscription model for bookshgelf ORM
################################

*/

var bookshelf    = require("../config/settings.js");
var bcrypt       = require("bcrypt-nodejs");
var UsersModel = require("../models/Users");

var Subscription = bookshelf.db.Model.extend({
  tableName: 'subscriptions'
});

var Subscriptions = bookshelf.db.Collection.extend({
  model: Subscription
});

module.exports = {
  Subscription: Subscription,
  Subscriptions: Subscriptions
};
