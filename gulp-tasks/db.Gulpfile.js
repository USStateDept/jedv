var gulp = require('gulp');
var _ = require('lodash');
var runSequence = require('run-sequence');
var exit = require('gulp-exit');

//constants
var DB_DOESNOT_EXIST_ERROR_CODE = '3D000';
var DB_ALREADY_EXISTS_ERROR_CODE = '42P04';

var env =  process.env.NODE_ENV || "development";
var dbSettings = require('../knexfile')[env];

gulp.task('db:drop', function() {
  var DROP_DB_COMMAND = "DROP DATABASE " + dbSettings.connection.database + ";";
  var knex = require('knex')({ client: dbSettings.client,
    connection: _.omit(dbSettings.connection, 'database')});

  return knex.raw(DROP_DB_COMMAND)
    .then(function(){
      console.log("droppped " + dbSettings.connection.database);
      knex.destroy();
    }).catch(function(err) {
      knex.destroy();
      if (err.code === DB_DOESNOT_EXIST_ERROR_CODE) {
        console.log(dbSettings.connection.database + " doesn't exist.");
      } else {
        throw err.detail;
      }
    });
});

gulp.task('db:migrate-and-seed', function() {
  var knex = require('knex')(dbSettings);

  return knex.migrate.latest()
    .then(function () {
      return knex.migrate.currentVersion();
    })
    .then(function (version) {
      console.log("Kicked database to version: " + version);
      return knex.seed.run()
        .then(function() {
          console.log("Seeded the data to the database.");
          knex.destroy();
        });
    }).then(function() {
      knex.destroy();
    })
    .catch(function (err) {
      console.error(err);
      knex.destroy();
    });
});

gulp.task('db:create', function () {

  //Posgresql script for creating a db if it doesn't exist.
  var CREATE_DB_SCRIPT = "CREATE DATABASE " + dbSettings.connection.database;

  var knex = require('knex')({ client: dbSettings.client,
    connection: _.omit(dbSettings.connection, 'database')});

  //running raw sql
  return knex.raw(CREATE_DB_SCRIPT)
    .then(function(){
      console.log('Created a new database named ' +
        dbSettings.connection.database);
      knex.destroy();

      knex = require('knex')(dbSettings);
      return knex.raw('CREATE EXTENSION if not exists POSTGIS')
        .then(function(){
          console.log('Created Postgis Extension');
          knex.destroy();
        });
  }).catch(function (err) {
    if(err.code == DB_ALREADY_EXISTS_ERROR_CODE) {
      console.log(dbSettings.connection.database + " already exists.");
    }
    knex.destroy();
  });
});

gulp.task('db:recreate', function(callback) {
  return runSequence(
    'db:drop',
    'db:create',
    'db:migrate-and-seed',
    callback
  );
});
