/*
################################
# leads_regions model junction table for bookshgelf ORM
################################

*/

var bookshelf      = require("../config/settings.js");
var bcrypt         = require("bcrypt-nodejs");
var LeadsModel     = require("../models/Leads");
var RegionsModel   = require("../models/Regions");

var leadsregions = bookshelf.db.Model.extend({
  tableName: 'leads_regions',
  lead: function(){
    return this.belongsTo(LeadsModel.Lead,'fid');
  },
  region: function(){
    return this.belongsTo(RegionsModel.Region,'region_id');
  }
});


module.exports = {
    leadsregions: leadsregions
};