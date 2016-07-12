/*
################################
# Leads model for bookshgelf ORM
################################
*/

var config    = require("../config/settings.js");
var bcrypt       = require("bcrypt-nodejs");
var RegionsModel = require("../models/Regions");
var SectorsModel = require("../models/Sectors");
var brandtModel  = require("../models/Leads_Sectors");
var Leads_CountriesModel  = require("../models/Leads_Countries");
var Leads_RegionsModel  = require("../models/Leads_Regions");
var CountriesModel = require("../models/Countries");
var mailFuncs    = require('../routes/mail/mail.js');
var utils    = require('../routes/utils/utils.js');

var Lead = config.db.Model.extend({
  tableName: 'leads',
  idAttribute: 'fid',

  region: function(){
    return this.belongsToMany(RegionsModel.Region).through(Leads_RegionsModel.leadsregion);
  },
  sectors: function(){
    return this.belongsToMany(SectorsModel.Sector).through(brandtModel.brandt);
  },
  country: function(){
     return this.belongsToMany(CountriesModel.Country).through(Leads_CountriesModel.leadscountries);
  },
  initialize: function(){
    this.on("fetched",function(){});
  }
});

var Leads = config.db.Collection.extend({
  model: Lead,
  initialize: function(){
    this.on("fetched",function(model,response,options){
        //var checksum = utils.checksum(response);
        //console.log("aaaaaaaaaa\n\n\n\n\n",this,"\n\n\n====\n\n\n");
    });
  }
});

module.exports = {
	Lead: Lead,
	Leads: Leads
};
