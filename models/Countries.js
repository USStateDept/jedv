/*
################################
# Countries model for bookshgelf ORM
################################

*/


var bookshelf      = require("../config/settings.js");
var bcrypt         = require("bcrypt-nodejs");
var LeadsModel     = require("../models/Leads");
var Leads_CountriesModel  = require("../models/Leads_Countries");

var Country = bookshelf.db.Model.extend({
  tableName: 'countries',
  leads: function(){
    return this.belongsToMany(CountryModel.Country,"lead_fid").through(Leads_CountriesModel.leadscountries);
  },
});

var Countries = bookshelf.db.Collection.extend({
  model: Country
});

module.exports = {
    Country: Country,
    Countries: Countries
};
