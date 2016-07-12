/*
################################
# Regions model for bookshgelf ORM
################################

*/

var bookshelf      = require("../config/settings.js");
var bcrypt         = require("bcrypt-nodejs");
var LeadsModel     = require("../models/Leads");
var Leads_RegionsModel  = require("../models/Leads_Regions");

var Region = bookshelf.db.Model.extend({
  tableName: 'regions',
  leads: function(){
     return this.belongsToMany(RegionModel.Country,"lead_fid").through(Leads_RegionsModel.leadsregions);
   },
});

var Regions = bookshelf.db.Collection.extend({
  model: Region
});

module.exports = {
    Country: Region,
    Countries: Regions
};
