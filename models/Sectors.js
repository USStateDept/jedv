/*
################################
# Sectors model for bookshgelf ORM
################################

*/

var bookshelf      = require("../config/settings.js");
var bcrypt         = require("bcrypt-nodejs");
var LeadsModel     = require("../models/Leads");
var brandtModel  = require("../models/Leads_Sectors");

var Sector = bookshelf.db.Model.extend({
  tableName: 'sectors',
  leads: function(){
    return this.belongsToMany(SectorsModel.Sector,"lead_fid").through(brandtModel.brandt);
  },
});

var Sectors = bookshelf.db.Collection.extend({
  model: Sector
});

module.exports = {
    Sector: Sector,
    Sectors: Sectors
};
