// load up the user model
var LeadsModel              = require('../models/Leads');

module.exports = function(app, passport) {

	/* GET home page. */
	
	app.get('/map', function(req, res, next) {
		res.redirect('/');
	});
 
};

