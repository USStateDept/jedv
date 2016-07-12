// load up the user model
var LeadsModel              = require('../models/Leads');

module.exports = function(app, passport) {

	/* GET home page. */
	
	app.get('/map', function(req, res, next) {

        new LeadsModel.Leads()
            .fetch()
            .then(function(leads){
                //console.log("leads =======> ",leads);
            });
		res.render('map', { title: 'BIDs', map: true });
	});
 
};

