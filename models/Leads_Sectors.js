/*
################################
# leads_sectors model junction table for bookshgelf ORM
################################

*/

var bookshelf      = require("../config/settings.js");
var bcrypt         = require("bcrypt-nodejs");
var LeadsModel     = require("../models/Leads");
var SectorsModel   = require("../models/Sectors");

var brandt = bookshelf.db.Model.extend({
  tableName: 'leads_sectors',
  lead: function(){
    return this.belongsTo(LeadsModel.Lead,'fid');
  },
  sector: function(){
    return this.belongsTo(SectorsModel.Sector,'id');
  }
});


module.exports = {
    brandt: brandt
};