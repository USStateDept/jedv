// config/passport.js
var _ = require('lodash');

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var UserModel      		= require('../models/Users');
var Mailer = require('../util/mailer.js').mailer;

// expose this function to our app using module.exports
module.exports = function(passport) {

	// =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        new UserModel.User({'id':id}).fetch().then(function(user){
            done(null,user);
        });
    });

 	// =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
		// find a user whose email is the same as the forms email
		// we are checking to see if the user trying to login already exists
        new UserModel.User({'email':email})
            .fetch()
            .then(function(user){
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {
                    new UserModel.User({
                        email: email,
                        password: UserModel.generateHash(password),
                        role: 'gov',
												verification_token: UserModel.generateVerificationToken(),
												is_verified: false
                    })
                    .save()
                    .then(function(newuser){
												Mailer.sendVerificationMail(newuser.get('email'), newuser.get('verification_token'), req.headers.host);
                        return done(null, newuser);
                    });
                }
            });
    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

				// callback with email and password from our form
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists

        new UserModel.User({'email':email})
            .fetch()
            .then(function(user){
                // if no user is found, return the message
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

                // if the user is found but the password is wrong
                if (!UserModel.validPassword(password,user.attributes))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

                // all is well, return successful user
                return done(null, user);

            });

    }));

};
