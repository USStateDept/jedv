// load up the user model
var LeadsModel = require('../models/Leads');
var SectorsModel = require('../models/Sectors');
var SubscriptionsModel = require('../models/Subscriptions');
var Leads_CountriesModel = require('../models/Leads_Countries');
var bookshelf = require('../config/settings.js');
var utils = require('../routes/utils/utils.js');
var _ = require('lodash');
var await = require('asyncawait/await');
var async = require('asyncawait/async');

module.exports = function(app, passport) {

  app.get('/api/feedback_results', function(req, res, next) {
    var FeedbackResult = require('../models/FeedbackResults');
    FeedbackResult.fetchAll({
        withRelated: ['answers', 'answers.question', 'answers.question.feedback', 'answers.question.inputType']
      })
      .then(function(FeedbackResults) {
        res.json(FeedbackResults.toJSON());
      });
  });

  app.post('/api/subscriptions', function(req, res, next) {
    createSubscription(req.body)
      .then(function(done) {
        res.json({
          error: false
        });
      })
      .catch(function(err) {
        console.log("Subscription Create -- Error ------");
        console.log(err);
        console.log(new Date());
        console.log("----------------------");
        res.json({
          error: true
        });
      });
  });

  /**
   * Subscription functions
   *
   */
  var createSubscription = async(function(data) {
    return new Promise(function(resolve, reject) {
      var results;
      var checksum;
      try {
        // query for intial results
        results = await (getInitialResults(data));
        // create checksum with results
        checksum = utils.checksum(results);
        data.checksum = checksum;
        // insert subscription
        created = await (insertSubscription(data));
      } catch (e) {
        reject(e)
      }

      if (created) {
        resolve(true);
      } else {
        reject("Uncaught Error - see createSubscription");
      }

    });
  });

  function getInitialResults(params) {
    return new Promise(function(resolve, reject) {

      var text_search = params["searchTerms[]"];
      var sectors = params["sectors[]"];
      var countries = params["countries[]"];
      var regions = params["regions[]"];
      var min = params["min-size"];
      var max = params["max-size"];

      var buildWhere = function(qb, term) {
        qb
          .orWhere(function() {
            this.where('project_title', 'like', '%' + term + '%')
              .orWhere('project_description', 'like', '%' + term + '%')
              .orWhere('project_number', 'like', '%' + term + '%');
          });
      };

      new LeadsModel.Leads().query(function(qb) {

          //if search is an array (more than 1 tag) iterate and build the where clause
          if (text_search instanceof Array) {
            for (var i = 0; i < text_search.length; i++) {
              buildWhere(qb, text_search[i]);
            }
            //else if it's not undefined, treat it as a string and pass to search
          } else if (typeof text_search !== 'undefined') {
            buildWhere(qb, text_search);
          }

          if (typeof sectors !== 'undefined') {
            qb.leftJoin('leads_sectors', 'leads.fid', 'leads_sectors.lead_fid');
            qb.whereIn('leads_sectors.sector_id', sectors);
          }
          if (typeof countries !== 'undefined') {
            qb.leftJoin('leads_countries', 'leads.fid', 'leads_countries.lead_fid');
            qb.whereIn('leads_countries.country_id', countries);
          }

          if (typeof regions !== 'undefined') {
            qb.whereIn('dos_region', regions);
          }

          qb
            .whereBetween('project_size', [min, max]);

          //if you don't do this, you get a row for every sector a lead is in
          qb
            .groupBy('fid');

        })
        .query({
          where: {
            cleared: true,
            archived: false
          }
        })
        .fetch()
        .then(function(leads) {
          resolve(leads);
        })
        .catch(function(err) {
          reject(err);
        });
    });
  }

  function insertSubscription(data) {
    return new Promise(function(resolve, reject) {
      new SubscriptionsModel.Subscription().save({
          title: data['title'],
          last_results_hash: data['checksum'],
          frequency: parseInt(data['whento'], 10),
          contacted_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          email: data['email'],
          filters: {
            countries: data['countries[]'],
            sectors: data['sectors[]'],
            regions: data['regions[]']
          },
        })
        .then(function(result) {
          resolve(true);
        })
        .catch(function(err) {
          reject(err);
        });
    });
  }

  app.get('/api/search', function(req, res, next) {
    res.render('search', {
      title: 'Search'
    });
  });

  app.get('/api/leads', function(req, res, next) {
    var rawSql = `
           SELECT fid, opp_unit, project_title, project_description, total_amount, appropriation_year, obligation_year,
            fund_source, implementing_partner, award_number, fund_mechanism, perform_start_date, perform_end_date, region, sub_region,
            locations, project_theme, project_pocs, public_website, cleared, editable, archived,
            auto_archive_date, the_geom,
            array_agg(DISTINCT country_id)as countries_list, array_agg(DISTINCT countries.geounit) as countries_names, array_agg(DISTINCT countries.dos_region) as dos_regions
            FROM leads
            INNER JOIN leads_countries ON leads.fid = leads_countries.lead_fid INNER JOIN countries ON leads_countries.country_id = countries.id
            GROUP BY leads.fid`;
    // new LeadsModel.Leads()
    //     .query({where: {cleared: false, archived: false}})

    //     .fetch({withRelated:['sectors','countries']})
    //     .then(function(leads){
    //         res.json(leads);
    //     });
    bookshelf.db.knex.raw(rawSql)
      .then(function(leads) {
        res.json(leads.rows);
      });
  });

  app.get('/api/leads/sectors', function(req, res, next) {
    bookshelf.db.knex('leads')
      .columns('sector')
      .distinct('sector_id')
      .orderBy('sector_id')
      .then(function(collection) {
        res.status(200).json(collection);
      });
  });

  app.get('/api/sectors', function(req, res, next) {
    bookshelf.db.knex('sectors')
      .columns('sector')
      .distinct('id')
      .orderBy('sector')
      .then(function(collection) {
        res.status(200).json(collection);
      });
  });

  app.get('/api/countries', function(req, res, next) {
    bookshelf.db.knex('countries')
      .columns('geounit', 'iso_a2')
      .distinct('id')
      .orderBy('geounit')
      .then(function(collection) {
        res.status(200).json(collection);
      });
  });

  app.get('/api/leads/opp_unit', function(req, res, next) {
    bookshelf.db.knex('leads')
      .columns('opp_unit')
      .distinct('fid')
      .orderBy('fid')
      .then(function(collection) {
        res.status(200).json(_.uniq(collection.map(c =>{ return c.opp_unit})));
      });

  });

  app.get('/api/leads/sub_region', function(req, res, next) {
    bookshelf.db.knex('leads')
      .columns('sub_region')
      .distinct('fid')
      .orderBy('fid')
      .then(function(collection) {
        res.status(200).json(collection);
      });
  });

  app.get('/api/leads/obligation_year', function(req, res, next) {
    bookshelf.db.knex('leads')
      .columns('obligation_year')
      .distinct('fid')
      .orderBy('fid')
      .then(function(collection) {
        res.status(200).json(collection);
      });
  });

  app.get('/api/leads/fund_source', function(req, res, next) {
    bookshelf.db.knex('leads')
      .columns('fund_source')
      .distinct('fid')
      .orderBy('fid')
      .then(function(collection) {
        res.status(200).json(collection);
      });
  });

  /* POSSIBLY UNNECESSARY 160418 */
  app.get('/api/regions', function(req, res, next) {
    bookshelf.db.knex('regions')
    var rawSql = `SELECT DISTINCT countries.dos_region as region
            FROM countries;`
    bookshelf.db.knex.raw(rawSql)
      .then(function(leads) {
        res.json(leads.rows);
      });
  });
  /* END POSSIBLY UNNECESSARY 160418 */

  app.get('/api/countriesByRegion', function(req, res, next) {
    bookshelf.db.knex('countries')
      .columns('sovereignt', 'dos_region', 'geounit')
      .distinct('id')
      .orderBy('geounit')
      .then(function(collection) {
        res.status(200).json(collection);
      });
  });

  app.get('/api/clear/:fid', function(req, res, next) {
    bookshelf.db.knex('leads')
      .where('fid', '=', req.params.fid)
      .update({
        Cleared: 1
      })
      .then(function(collection) {
        res.status(200).json(collection);
      });
  });

  app.get('/api/archive/:fid', function(req, res, next) {
    bookshelf.db.knex('leads')
      .where('fid', '=', req.params.fid)
      .update({
        Archived: 1
      })
      .then(function(collection) {
        res.status(200).json(collection);
      });

  });
};
