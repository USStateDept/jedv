var _ = require('lodash');

var config = {};
var env =  process.env.NODE_ENV || "development";
var dbSettings = require('../knexfile')[env];

if ( env == 'production' ){
	//load prod env specific config options
	config = require('./production');
} else if ( env == 'staging' ) {
	//load staging specific config options
	config = require('./staging');
} else if ( env == 'ci' ) {
  config = require('./testing');
} else {
	//assume development env if not explicitly prod or staging
	config = require('./development');
}

var knex = require('knex')(dbSettings);
config.db_connetion = dbSettings.connection;
config.db = require('bookshelf')(knex);
config.db.plugin('registry');
module.exports = config;
