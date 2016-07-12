var UserModel = require('../models/Users');

exports.seed = function(knex, Promise) {
  var users = [];

  if(process.env.NODE_ENV !== 'production') {
    users.push({email: 'admin@state.gov', password: UserModel
      .generateHash('password'), role: 'admin', created_at: new Date()});
    users.push({email: 'user@state.gov', password: UserModel
      .generateHash('password'), role: 'gov', created_at: new Date()});
  }

  return knex('accounts').insert(
    users
  );
};
