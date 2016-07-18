var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var nunjucks = require('./config/view-engine.js');
var config = require('./config/settings.js');
var routes = require('./routes/index');
var passport = require('passport');
var flash    = require('connect-flash');
var session      = require('express-session');
var pg = require('pg');
var pgSession = require('connect-pg-simple')(session);
var EntryControl = require('./util/entrycontrol');

var app = express();

/* Explicitly creating the nunjucks environment in this way
allows nunjucks global variables to be set. Nunjucks
global variables are accessible from all templates. This is useful
for building templates based on unique user details (such as what
role they are logged in as)
https://mozilla.github.io/nunjucks/api#configure
*/
appRoot = path.resolve(__dirname);
var envNunjucks = nunjucks(app,appRoot);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine','html');

require('./config/passport')(passport);

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public/images', 'bidsIcon.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components',  express.static(path.join(__dirname, '/bower_components')));

// required for passport
app.use(session({
  store: new pgSession({
    pg : pg,                                  // Use global pg-module
    conString : 'pg://'+config.db_connetion.user+':'+config.db_connetion.password+'@'+config.db_connetion.host+'/'+config.db_connetion.database, // Connect using something else than default DATABASE_URL env variable
    tableName : 'session'               // Use another table-name than the default "session" one
  }),
  secret: "thisisverysekritandsafe",
  saveUninitialized: true,
  resave: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

/* Middleware for setting this users details for use in nunjucks templating */
app.use(function(req, res, next) {
  if (req.isAuthenticated()) {
      envNunjucks.addGlobal('currentUser', {
          'id': req.user.attributes.id,
          'email': req.user.attributes.email,
          'role': req.user.attributes.role
      });
  } else {
      envNunjucks.addGlobal('currentUser', {
          'id': '',
          'email': '',
          'role': ''
      });
  }
  next();
});

// EntryControl settings
var EC = new EntryControl({
  protocols: ["ip"],
  allowedIpRange: ['127.0.0.1'],
  protectedRoutes: [
    {path: '/api/leads' , method: 'POST'}, // adding a lead ?
    {path: '/api/leads' , method: 'PUT'}, // updating a lead ?
    {path: '/leadform' , method: 'POST'}, // adding a lead
    {path: '/leadform' , method: 'PUT'} // updating a lead
  ],
  limitedRoutes: [
    {path: '/' , method: 'GET'}  // lets give a token on entry (if applicable)
  ],
  logging: app.get('env') == 'production' ? false : true
});

// hook in IP/Token Protection - EntryControl
app.use(function (req, res, next) {
  var verdict = EC.gatewayVerification(req); // returns pass message and token
  if(verdict.pass === true && verdict.token) {
    res.cookie("BIDS_ENTRY_CONTROL_TOKEN" , verdict.token);
    next();
  } else if (verdict.pass) {
    next();
  } else  {
    res.status(401).send("Access Denied for unauthorized user");
  }
});

require('./routes/index.js')(app,passport,envNunjucks,appRoot);
require('./routes/map.js')(app,passport);
require('./routes/api.js')(app,passport);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  console.error(err.stack);
  res.render('error', {
    message: err.message,
    error: err
  });
});

if (app.get('env') === 'production') {
  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
  });
}

app.listen(80, function () {
  console.log('JEDV has successfully started on port 80.');
});

module.exports = app;
