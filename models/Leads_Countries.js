/*
################################
# leads_countries model junction table for bookshgelf ORM
################################

*/

var bookshelf      = require("../config/settings.js");
var bcrypt         = require("bcrypt-nodejs");
var LeadsModel     = require("../models/Leads");
var CountriesModel   = require("../models/Countries");

var leadscountries = bookshelf.db.Model.extend({
  tableName: 'leads_countries',
  lead: function(){
    return this.belongsTo(LeadsModel.Lead,'fid');
  },
  country: function(){
    return this.belongsTo(CountriesModel.Country,'id');
  }
});

module.exports = {
    leadscountries: leadscountries
};