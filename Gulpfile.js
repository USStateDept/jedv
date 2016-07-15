var gulp = require('gulp');
var util = require('gulp-util');
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var nodemon = require('gulp-nodemon');
var requireDir = require('require-dir');

//requiring all the tasks from the files in the gulp-tasks directory
requireDir('./gulp-tasks');

var config = {
    sassDestination: 'public/css',
    sassPattern: 'public/sass/**/*.scss',
    production: !!util.env.production
};

gulp.task('sass', function () {
  var outputStyle = config.production ? 'compressed' : '';

	return gulp.src(config.sassPattern)
	.pipe(sass({outputStyle: outputStyle, sourceComments: 'map'}, {errLogToConsole: true}))
	.pipe(prefix("last 2 versions", "> 1%", "ie 8", "Android 2", "Firefox ESR"))
	.pipe(gulp.dest(config.sassDestination))
	.pipe(reload({stream:true}));
});

gulp.task('browser-sync', ['nodemon'], function () {

  // for more browser-sync config options: http://www.browsersync.io/docs/options/
  browserSync({
    // informs browser-sync to proxy our expressjs app which would run at the following location
    proxy: 'http://localhost:3000',

    // informs browser-sync to use the following port for the proxied app
    // notice that the default port is 3000, which would clash with our expressjs
    port: 4000,

    // open the proxied app in chrome
    // browser: ['google-chrome']
  });
});

gulp.task('default', ['sass', 'browser-sync'], function () {
	gulp.watch(config.sassPattern, ['sass']);
	gulp.watch(["public/js/**/*.js", "views/*.html"], reload);
});

//used for creating static assets for production
gulp.task('deploy', ['sass']);

//nodemon to monitor files and restart the server
gulp.task('nodemon', function () {
  nodemon({
    script: 'app',
    ext: 'js html json'
  });
});
