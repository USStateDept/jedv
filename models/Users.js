/*
################################
# Leads model for bookshgelf ORM
################################

*/

var bookshelf = require("../config/settings.js");
var bcrypt    = require("bcrypt-nodejs");
var crypto = require('crypto');

var User = bookshelf.db.Model.extend({
  tableName: 'accounts',
  hasTimestamps: true
});

// methods ======================
// generating a hash
function generateHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

// checking if password is valid
function validPassword(password,userModel) {
  return bcrypt.compareSync(password, userModel.password);
}

function generateVerificationToken() {
  return crypto.randomBytes(64).toString('hex');
}

module.exports = {
	User: User,
	generateHash: generateHash,
	validPassword: validPassword,
  generateVerificationToken: generateVerificationToken
};
