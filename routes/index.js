var bookshelf = require('../config/settings.js');
var _ = require('lodash');
var http = require('http');
var LeadsModel = require('../models/Leads');
var FeedbackModel = require('../models/Feedbacks');
var SectorsModel = require('../models/Sectors');
var mail = require('./mail/mail.js');
var csv = require('fast-csv');
var path = require('path');
var validator = require('validator');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var utils = require('./utils/utils.js');
var multer = require('multer');
var User = require('../models/Users').User;

/* FOR DEVELOPMENT */
var thisLead = {};
/* END, FOR DEVELOPMENT */

module.exports = function(app, passport, envNunjucks, appRoot) {

  /* GET home page. */
   var uploading = multer({
    dest: appRoot + '/public/uploads/'
  });

  app.get('/', function(req, res, next) {
    var user = null;
    var loggedIn = req.isAuthenticated();
    var show_overlay = true;

    var infoMessages = req.flash('infoMessages');
    var messages = req.flash('messages');

    if (req.user && req.user.attributes) {
      user = req.user.attributes;
      show_overlay = false;
    }

    res.render('map', {
      title: 'Express',
      user: user,
      loggedIn: loggedIn,
      overlay: show_overlay,
      infoMessages: infoMessages,
      messages: messages,
      map: true
    });
  });

  app.get('/faq', function(req, res, next) {
    res.render('faq', {
      title: 'FAQs'
    });
  });

  /**
   * /feedback
   *
   * Renders contact page, sends feedbacks collection for rendering survey questions
   * on the page.
   **/
  app.get('/feedback', function(req, res, next) {
    var Feedback = require('../models/Feedbacks');
    var flashMessages = req.flash('infoMessages');

    var feedbacks = Feedback
      .fetchAll({ withRelated:
        [
          'questions.inputType',
          'questions.optionGroup',
          'questions.optionGroup.optionChoices'
        ]
    }).then((feedbacks) => {
      res.render('contact', {
        title: 'Contact',
        infoMessages: flashMessages,
        feedbacks: feedbacks.toJSON()
      });
    });
  });

  /**
  *
  *
  **/
  app.post('/feedback', function(req, res, next) {
   var formType = req.query.type;
   var data = req.body;
   var Question = require('../models/Questions');
   var Answer = require('../models/Answers');
   var FeedbackResult = require('../models/FeedbackResults');

   new FeedbackResult({
     "created_at": new Date()
   })
    .save()
    .then(function(feedbackResult){
      _.forOwn(data, function(value, key) {
         Question.where('question_name', key).fetch().then(function(question) {
           new Answer({
             "answer_text": value
           })
           .save()
           .then(function(answer){
             answer.set('feedback_result_id', feedbackResult.id);
             answer.set('question_id', question.id);
             answer.save();
           });
         });
      });

      req.flash('infoMessages', ["Thank you, your feedback has been submitted."]);
      res.redirect('/feedback');
    }).catch(function(err) {
      console.log("Feedback results could not be saved!");
      console.error(err);
    });
  });

  app.get('/leadform', function(req, res, next) {
    res.render('add-lead-form', {
      title: 'Lead Form'
    });
  });

  app.post('/leadform', uploading.array(), function(req, res, next) {
    console.log(req.body)
    utils.ingestLeadData([req.body])
      .then(()=>{
        res.send({
          completed: true
        })
      })
      .catch(()=>{
        res.send({
          completed: false
        })
      })

  });

  // =====================================
  // LOGIN ===============================
  // =====================================
  // process the login form
  var LOGIN_FAILURE_MESSAGE = "The username and password you entered did not match our records. Please double-check and try again.";
  app.post('/login', function(req, res, next) {
    passport.authenticate('local-login', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) {
        req.flash('error', LOGIN_FAILURE_MESSAGE);
        return res.redirect('/login');
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.redirect('/');
      });
    })(req, res, next);
  });

  app.get('/new-user', function(req, res) {
    if(req.user && !req.user.get('is_verified')) {
      res.render('auth/new-user', {
        email: req.user.get('email')
      });
    } else {
      res.redirect('/');
    }
  });

  /*
   * This route returns a login page. Also returns flash error messages if
   * the exist.
   */
  app.get('/login', function(req, res) {
    res.render('auth/login', {
      messages: req.flash('error')
    });
  });

  var SIGNUP_FAILURE_MESSAGE = "Signup failed, please try again.";
  app.post('/signup', function(req, res, next) {
    passport.authenticate('local-signup', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) {
        req.flash('error', SIGNUP_FAILURE_MESSAGE);
        return res.redirect('/');
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.redirect('/new-user');
      });
    })(req, res, next);
  });

  app.get('/verify_token', function(req, res) {
    var token = req.query.token;
    User.where('verification_token', token).fetch().then(function(user) {
        user.save({
          is_verified: true,
          verification_token: ''
        }).then(function () {
          req.flash('infoMessages', ["Your token has been verified."]);
          res.redirect('/');
        }).catch((err) => {
          req.flash('messages', ["Invalid token"]);
          res.redirect('/');
        });
    }).catch((err) => {
      req.flash('messages', ["Invalid token"]);
      res.redirect('/');
    });
  });

  // =====================================
  // PROFILE SECTION =====================
  // =====================================
  // we will want this protected so you have to be logged in to visit
  // we will use route middleware to verify this (the isLoggedIn function)
  app.get('/profile', isLoggedIn, function(req, res) {
    new LeadsModel.Leads()
      .query({
        where: {
          cleared: false,
          archived: false
        }
      })
      .fetch()
      .then(function(leads) {
        res.render('profile/profile-leads', {
          user: req.user.attributes,
          leads: leads.models,
          size: leads.length,
          messages: req.flash('messages')
        });
      });
  });

  app.get('/profile/leads', isLoggedIn, function(req, res) {
    if (envNunjucks.getGlobal('currentUser').role == 'admin') {
       var rawSql = `
            SELECT fid, project_title, project_number, project_size, project_description,
            keyword, source, project_announced, tender_date, implementing_entity,
            project_pocs, post_comments, submitting_officer, submitting_officer_contact,
            link_to_project, business_url, cleared, archived, auto_archive_date,
            the_geom, editable, locations,
            array_agg(sector_id) as sectors_list, array_agg(sectors.sector) as sectors_names,
            array_agg(DISTINCT country_id)as countries_list, array_agg(DISTINCT countries.geounit) as countries_names, array_agg(DISTINCT countries.dos_region) as dos_regions
            FROM leads
            INNER JOIN leads_sectors ON leads.fid = leads_sectors.lead_fid INNER JOIN sectors ON leads_sectors.sector_id = sectors.id
            INNER JOIN leads_countries ON leads.fid = leads_countries.lead_fid INNER JOIN countries ON leads_countries.country_id = countries.id
            GROUP BY leads.fid`;
        bookshelf.db.knex.raw(rawSql)
        .then(function(leads){

                res.send({ aaData:leads.rows});
            });
    } else if (envNunjucks.getGlobal('currentUser').role == 'gov') {
      new LeadsModel.Leads()
        .query({
          where: {
            account_id: envNunjucks.getGlobal('currentUser').id
          }
        })
        .fetch()
        .then(function(leads) {
          res.send({
            aaData: leads
          });
        });
    } else {
      console.log('\nNo query issued to retrieve leads from profile/leads route.\n');
    }
  });

  app.post('/profile/leads', isLoggedIn, function(req, res) {
    // console.log(req.body.fid);
    var thisFid = req.body.fid;
    // console.log('\n FRONT END FORM OBJECT OF EDITED LEAD: \n');
    // console.log(req.body);

    // does fid already exist
    new LeadsModel.Leads()
      .query({
        where: {
          fid: req.body.fid
        }
      })
      .fetch()
      .then(function(lead) {
        if (lead) {
          update_lead(thisFid, req.body);
        } else {
          console.log('\n NO LEAD EXISTS \n');
        }
      });
    res.redirect('/profile');
  });


  app.get('/leads/:id', function(req, res, next){
    LeadsModel.Lead
      .where('fid', req.params.id)
      .fetch()
      .then(function(lead) {
        console.log(lead.toJSON());
        res.render('lead', {
          lead: lead.toJSON()
        });
      }).catch((err) => {
        console.log(err);
      });
  });

  app.post('/profile/bulkUpload2', uploading.single('bulkcsv'),function(req, res) {
    // some initial variables
    var theLeads = [];
    var userMessages = [];
    var responseSent = false;

    // an object containing the tests and state of the tests
    var csvValidations = {
      "haveValidationsBeenRun": false,
      "wereValidationsSuccessful": true,
      "numberOfTestsRun": 0,
      "tests": {
        countryValidation: function(theData) {
          return new Promise((resolve, reject) => {
            var result;
            var resultMessage;

            if (theData.country) {
              result = true;
              resultMessage = 'Project Country passes validations!';
            } else {
              result = false;
              resultMessage = 'Missing Project Country! for project: ' + theData.project_title;
            }
            resolve([result, resultMessage]);
          });
        },
        projectTitleValidation: function(theData) {
          return new Promise((resolve, reject) => {
            var result;
            var resultMessage;

            if (theData.project_title) {
              result = true;
              resultMessage = 'Project Title passes validations!';
            } else {
              result = false;
              resultMessage = 'Missing Project Title! for project: ' + theData.project_title;
            }
            resolve([result, resultMessage]);
          });
        },
        projectNumberValidation: function(theData) {
          return new Promise((resolve, reject) => {
            // @STUB - field is optional
            resolve([true, 'Project Number passes validations!']);
          });
        },
        sectorValidation: function(theData) {
          return new Promise((resolve, reject) => {
            var result;
            var resultMessage;

            if (theData.sector) {
              result = true;
              resultMessage = 'Project Sector passes validations!';
            } else {
              result = false;
              resultMessage = 'Missing Project Sector! for project: ' + theData.project_title;
            }
            resolve([result, resultMessage]);
          });
        },
        projectSizeValidation: function(theData) {
          return new Promise((resolve, reject) => {
            // @STUB, field is just an optional string
            resolve([true, 'Project Size passes validations!']);
          });
        },
        projectDescriptionValidation: function(theData) {
          return new Promise((resolve, reject) => {
            // @STUB, optional text field
            resolve([true, "Project Description Passes"]);
          });
        },
        keywordValidation: function(theData) {
          return new Promise((resolve, reject) => {
            //@STUB optional text
            resolve([true, 'Keyword passes']);
          });
        },
        sourceValidation: function(theData) {
          return new Promise((resolve, reject) => {
            //@STUB optional text
            resolve([true, 'Source passes']);
          });
        },
        projectAnnouncedValidation: function(theData) {
          return new Promise((resolve, reject) => {
            var result;
            var resultMessage;

            if(!theData.tender_date) {
              result = true;
              resultMessage = 'Tender Passes'
            } else {
              if (validator.isDate(theData.project_announced)) {
                result = true;
                resultMessage = 'Project Announced passes validations!';
              } else {
                switch (false) {
                  case (isDate):
                    resultMessage = 'The Project Announced for ' + theData.project_title + ' is not formatted as a Date. Please enter it as date (YYYY-MM-DD).';
                    break;
                  default:
                    result = false;
                }
              }
            }

            resolve([result, resultMessage]);
          });
        },
        tenderDateValidation: function(theData) {
          return new Promise((resolve, reject) => {
            var result;
            var resultMessage;
            if(!theData.tender_date) {
              result = true;
              resultMessage = 'Tender Passes'
            } else {
              if (validator.isDate(theData.tender_date)) {
              result = true;
              resultMessage = 'Project Tender Date passes validations!';
              } else {
                switch (false) {
                  case (isDate):
                    resultMessage = 'The Project Tender Date for ' + theData.project_title + ' is not formatted as a Date. Please enter it as date (YYYY-MM-DD).';
                    break;
                  default:
                    // null
                }
              }
            }
            resolve([result, resultMessage]);
          });
        },
        projectFundingSourceValidation: function(theData) {
          return new Promise((resolve, reject) => {
            // @STUB optional text
            resolve([true, 'Funding Source Passed']);
          });
        },
        projectPOCsValidation: function(theData) {
          return new Promise((resolve, reject) => {
            var result = false;
            var resultMessage = '';
            var isEmail;

            if(!theData.project_pocs || theData.project_pocs == "" || theData.project_pocs == undefined) {
              theData.project_pocs = null;
              isEmail = true;
            } else {
              isEmail = (validator.isEmail(theData.project_pocs)) ? true : false;
            }

            if (isEmail) {
              result = true;
              resultMessage = 'Project POCs passes validations!';
            } else {
              switch (false) {
                case (isEmail):
                  resultMessage = 'The Project POCs for ' + theData.project_title + ' is not formatted as an email. Please enter an email.';
                  break;
                default:
                  // null
              }
            }

            resolve([result, resultMessage]);
          });
        },
        postCommentsValidation: function(theData) {
          return new Promise((resolve, reject) => {
            // @STUB OPTIONAL TEXT
            resolve([true, 'Comments Passes']);
          });
        },
        submittingOfficerValidation: function(theData) {
          return new Promise((resolve, reject) => {
            var result = false;
            var resultMessage = '';

            var exists = (theData.submitting_officer) ? true : false;
            var isString = (typeof theData.submitting_officer === 'string') ? true : false;

            if (exists && isString) {
              result = true;
              resultMessage = 'Submitting Officer passes validations!';
            } else {
              switch (false) {
                case (exists):
                  resultMessage = 'The project \"' + theData.project_title + '\" does not have an Submitting Officer. Please enter a Submitting Officer.';
                  break;
                case (isString):
                  resultMessage = 'The Submitting Officer of the project \"' + theData.project_title + '\" is not a name. Please enter it as a text/name.';
                  break;
                default:
                  console.log('SHOULD NOT PRINT. Logic should not get here. Submitting Officer validation case statement.');
              }
            }

            resolve([result, resultMessage]);
          });
        },
        submittingOfficerContactValidation: function(theData) {
          return new Promise((resolve, reject) => {
            var result = false;
            var resultMessage = '';

            var exists = (theData.submitting_officer_contact) ? true : false;
            var isEmail = (validator.isEmail(theData.submitting_officer_contact)) ? true : false;

            if (isEmail) {
              result = true;
              resultMessage = 'Project POCs passes validations!';
            } else {
              switch (false) {
                case (exists):
                  resultMessage = 'The project \"' + theData.project_title + '\" does not have an Submitting Officer Contact. Please enter an Submitting Officer Contact.';
                  break;
                case (isEmail):
                  resultMessage = 'The Submitting Officer Contact for ' + theData.project_title + ' is not formatted as an email. Please enter an email.';
                  break;
                default:
                  console.log('SHOULD NOT PRINT. Logic should not get here. Submitting Officer Contact validation case statement.');
              }
            }

            resolve([result, resultMessage]);
          });
        },
        linkToProjectValidation: function(theData) {
          return new Promise((resolve, reject) => {
            var result;
            var resultMessage;
            var isURL;

            if(!theData.link_to_project) {
              isURL = true;
            } else {
              isURL = (validator.isURL(theData.link_to_project, {
                protocols: ['http', 'https'],
                require_protocol: true
              })) ? true : false;
            }

            if (isURL) {
              result = true;
              resultMessage = 'Link to Project passes validations!';
            } else {
              switch (false) {
                case (isURL):
                  resultMessage = 'The Link to Project for ' + theData.project_title + ' is not appropriately formatted as an URL. Please enter a valid URL.';
                  break;
                default:
                  // null
              }
            }

            resolve([result, resultMessage]);
          });
        },
        businessURLValidation: function(theData) {
          return new Promise((resolve, reject) => {
            var result;
            var resultMessage;
            var isURL;

            if(!theData.business_url) {
              isURL = true;
            } else {
              isURL = (validator.isURL(theData.business_url, {
                protocols: ['http', 'https'],
                require_protocol: true
              })) ? true : false;
            }

            if (isURL) {
              result = true;
              resultMessage = 'Link to Business passes validations!';
            } else {
              switch (false) {
                case (isURL):
                  resultMessage = 'The Business Link for ' + theData.project_title + ' is not appropriately formatted as an URL. Please enter a valid URL.';
                  break;
                default:
                  // null
              }
            }

            resolve([result, resultMessage]);
          });
        },
        clearedValidation: function(theData) {
          return new Promise((resolve, reject) => {
            var result = false;
            var resultMessage = '';

            function str2bool(strvalue){
              return (strvalue && typeof strvalue == 'string') ? (strvalue.toLowerCase() == 'true' || strvalue == '1') : (strvalue == true);
            }

            var exists = (theData.cleared) ? true : false;
            var isValid = (str2bool(theData.cleared) == false || str2bool(theData.cleared) == true) ? true : false;


            if (exists && isValid) {
              result = true;
              resultMessage = 'Cleared passes validations!';
            } else {
              switch (false) {
                case (exists):
                  resultMessage = 'The project \"' + theData.project_title + '\" does not have a Cleared value. Please enter a Cleared value (a zero or one).';
                  break;
                case (isValid):
                  resultMessage = 'The Cleared value for ' + theData.project_title + ' is not a valid input. Please enter a Cleared value (a zero for an uncleared lead or a one for a cleared lead).';
                  break;
                default:
                  // null
              }
            }

            resolve([result, resultMessage]);
          });
        },
        archivedValidation: function(theData) {
          return new Promise((resolve, reject) => {
            var result = false;
            var resultMessage = '';

            var exists = (theData.archived) ? true : false;
            var isValid = (str2bool(theData.archived) == false || str2bool(theData.archived) == true) ? true : false;

            function str2bool(strvalue){
              return (strvalue && typeof strvalue == 'string') ? (strvalue.toLowerCase() == 'true' || strvalue == '1') : (strvalue == true);
            }

            if (exists && isValid) {
              result = true;
              resultMessage = 'Archive value passes validations!';
            } else {
              switch (false) {
                case (exists):
                  resultMessage = 'The project \"' + theData.project_title + '\" does not have a Archived value. Please enter a Archived value (a zero or one).';
                  break;
                case (isValid):
                  resultMessage = 'The Archive value for ' + theData.project_title + ' is not a valid input. Please enter an archive value (a zero for an active lead or a one for an archived lead).';
                  break;
                default:
                  console.log('SHOULD NOT PRINT. Logic should not get here. Archived validation case statement.');
              }
            }

            resolve([result, resultMessage]);
          });
        }
      },
      "errors": []
    };

    //get data from csv
    var parseCSV = function(path) {
      var dataSet = [];
      csv.fromPath(req.file.path, {
          headers: true
        })
        .on("data", function(data) {
          // PUSH INTO DATASET
          dataSet.push(data);
        })
        .on("end", function() {
          initTests(dataSet)
            .then(function(theLeads) {
              // insert leads
              if(theLeads.failed) {
                res.status(200).json({
                  completed: false,
                  reasons: theLeads.messages
                });
              } else {
                 insertLeads(theLeads);
              }
            })
            .catch(function(e) {
              console.log("init tests higher error");
              console.log(e)
            })
        });
    };

     var runValidations = async(theData => {
      return new Promise((resolve, reject) => {

        csvValidations.numberOfTestsRun = 0;
        numberOfTests = Object.keys(csvValidations.tests).length;

        while (numberOfTests > csvValidations.numberOfTestsRun) {

          //run the tests
          for (var test in csvValidations.tests) {
            if (csvValidations.tests.hasOwnProperty(test)) {
              //testResult should be an array[boolean, message]
              var thisTest = csvValidations.tests[test];

              // AWAIT
              var testResult = await (thisTest(theData));

              //if test passes
              if (testResult[0]) {
                //do nothing
              } else {
                //there was an error. add the error message to csvValidations
                csvValidations.errors.push(testResult[1]);
              }
              csvValidations.numberOfTestsRun += 1;
            }
          }
        }

        resolve(csvValidations.errors);
      });
    });

    var runDataCheck = async(data => {
      return new Promise((resolve, reject) => {
        try {
          var errors = await (runValidations(data));
          var gate_response = await (didValidationsPassFail(errors));
        } catch (e) {
          console.log("===!!!>>  ERROR  ===!!!>");
          console.log(e);
        }

        if (gate_response.length > 0) {
          reject(gate_response);
        } else {
          resolve(true);
        }
      });
    });

    // top level async functionyou're
    var initTests = async(dataSet => {

      return new Promise((resolve, reject) => {
        var error_message = "";
        var itr = 0;
        var err = false;
        var theLeads = [];

        //While there are more objects (i.e. csv rows) in the dataSet
        //run the validations on the latest row
        while (itr < dataSet.length) {

          try {
            //returns a promise that will resolve if there are no errors and reject (i.e. error) if there are errors
            await (runDataCheck(dataSet[itr]));
          } catch (e) {
            console.log('===!!!>  initTests ERROR  ===!!!>');
            console.log(e);

            //If there is an error stop running validations on the csv
            error_message = e[0];
            err = true;
            break;
          }

          //If there were no validations issues with this row of data
          //push it into theLeads object to be inserted into the database
          if (!err) {
            theLeads.push(dataSet[itr]);
          }
          itr++;
        }

        if (err) {
          resolve({failed: true, messages: error_message});
        } else {
          resolve(theLeads);
        }
      });
    });

    var didValidationsPassFail = (errors => {
      return new Promise((resolve, reject) => {
        if (errors.length > 0) {

          csvValidations.wereValidationsSuccessful = false;
          userMessages.unshift(csvValidations.errors[0]);

          resolve(errors);
        } else {
          resolve([]);
        }
      });
    });

    // DO INSERTS
    var insertLeads = function(theseLeads) {
      try {

        utils.ingestLeadData(theseLeads)
          .then((completed)=>{
            console.log(completed)
            if (completed) {
              // send success
              res.json({
                completed: true
              });
            } else {
              res.json({
                completed: false
              });
            }
          })
          .catch(e => {
            console.log("===!!!> ingest Error  ===!!!>");
            console.log(e);
            res.json({
                completed: false,
                reasons: ['code error']
            });
          });
      } catch (e) {
        console.log(e)
        console.log("-------!!!> top level ingest error -------!!!>");
      }
    };

    parseCSV(req.file.path);

  });

  app.get('/profile/:filter', isLoggedIn, function(req, res) {
    var filter = req.params.filter;
    var options = {};

    if (filter == "cleared") {
      options["cleared"] = true;
    } else if (filter == "archived") {
      options["archived"] = true;
    }

    new LeadsModel.Leads()
      .query({
        where: options
      })
      .fetch()
      .then(function(leads) {
        res.render('profile/profile', {
          user: req.user.attributes,
          leads: leads.models,
          size: leads.length,
          filter: filter
        });
      });
  });


  app.get('/admin', isAdmin, function(req, res) {

    new FeedbackModel.Feedbacks()
      .fetch()
      .then(function(feedbacks) {
        res.render('admin', {
          user: req.user.attributes,
          feedbacks: feedbacks.models
        });
      });
  });


  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

};

// =====================================
// FUNCTIONS ===========================
// =====================================

function update_lead(fid, formData, cb) {
  var isArchived = formData.archived === 'on';
  new LeadsModel.Lead()
    .query({
      where: {
        fid: fid
      }
    })
    .save({
      project_title: formData.proj_title,
      project_number: formData.proj_number,
      project_size: formData.est_proj_value,
      project_description: formData.proj_desc,
      keyword: formData.keywords,
      link_to_project: formData.proj_website,
      project_announced: (formData.proj_announced ? formData.proj_announced : null),
      tender_date: (formData.expected_tender_date ? formData.expected_tender_date : null),
      auto_archive_date: (formData.auto_archive_date ? formData.auto_archive_date : null),
      implementing_entity: formData.imp_entity,
      project_pocs: formData.imp_entity_poc,
      business_url: formData.us_embassy_business_page,
      submitting_officer: formData.usg_officer,
      submitting_officer_contact: formData.usg_poc_email,
      post_comments: formData.post_comments,
      archived: isArchived
    }, {
      patch: true,
      method: 'update'
    })
    .then(function(result) {});
}

function generateSubscribeMarkup(data) {
  var html = "Thank you for subscribing to receive updates from the Business Information Database System (BIDS)!</br>";

  html += "Please verify your email by clicking here.</br>";

  html += "Here are the details about your subscription:   You will receive emails on a [daily/weekly/monthly] basis that match the following criteria:  [search criteria here].</br>";

  html += "You may update your settings at any time by logging into your account on BIDS.</br>";

  html += "Has the information you found on BIDS been useful to you?  We’d love your suggestions, comments, or questions – please fill out a four-question survey or contact us directly at BIDS-Mailbox@state.gov.</br>";

  html += "Thanks again for using BIDS!</br>";

  return html;
}

// function save_lead(formData, userID, cb) {
//   // return promise function from utils
//   return utils.ingestLeadData([formData]);
// }

// route middleware to make sure a user is an admin

function isAdmin(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.attributes.role == 'admin') {
      return next();
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) {
    if (req.user && req.user.attributes) {
      if(!req.user.get('is_verified')) {
        { return res.render('auth/not-verified'); }
      }
    }
    return next();
  }
  // if they aren't redirect them to the home page
  res.redirect('/');
}
