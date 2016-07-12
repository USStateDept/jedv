// EntryControl
// eDip - Michael Ramos
// v0.0.4
// uuid: using rfc4122 v4 -- http://tools.ietf.org/html/rfc4122#page-14
"use strict";
var _ = require('lodash');
var uuid = require('node-uuid');
var jwt = require('jsonwebtoken');

function EntryControl(user_options) {
  // base entry options (not user defined)
  this._options = {};
  try {
        this._validateUserOptions(user_options);
        this._registerUserOptions(user_options);
  } catch (e){
    console.log(e);
  }
}

EntryControl.prototype._validateUserOptions = function(user_options) {
    return true;
}

EntryControl.prototype._registerUserOptions = function(user_options){
    var self = this;
    var protocols = user_options.protocols || ["password"];
    
    var userOptions = {
      protocols:       protocols,
      protectedRoutes: user_options.protectedRoutes || [],
      limitedRoutes:   user_options.limitedRoutes   || [],
      databaseClient:  user_options.databaseClient  || null,
      allowedIpRange:  user_options.allowedIpRange  || null,
      tokenAlgorithm:  user_options.tokenAlgorithm  || "HS256",
      logging:         user_options.logging || false
    }
    
    if( protocols.indexOf("password") != -1 ) {
        userOptions.tokenType = 'jwt-password'
    } else {
        userOptions.tokenType = 'jwt-random'
    }
    
    self.config = Object.assign(userOptions, self._options);
    
    var _guardCommand = new GuardCommand(protocols, self.config);
    self._guardSquad = _guardCommand.squad;
    
}

EntryControl.prototype.gatewayVerification = function(request) {
    var self = this;
    var preVerify = false;
    
    if (request.cookies.BIDS_ENTRY_CONTROL_TOKEN){
        preVerify = true;
    }
    
    var protect =  _.findIndex(self.config.protectedRoutes, function(r) {return (r.method == request.method && r.path == request.originalUrl);}) != -1;
    var limit   =  _.findIndex(self.config.limitedRoutes, function(r)   {return (r.method == request.method && r.path   == request.originalUrl);}) != -1;
                     
    try {
        if (!preVerify && protect) {
            this._logger("Guard verifying new identity on protected route " + request.originalUrl );
            return this._guardSquad.verifyNewIdentity(request, 'protected');
        } else if(!preVerify && limit){
            this._logger("Guard verifying returning identity on limited route: " + request.originalUrl );
            return this._guardSquad.verifyNewIdentity(request, 'limited');
        } else if( preVerify && protect ) {
            this._logger("Guard verifying a retuning user for protected route: " + request.originalUrl );
            return this._guardSquad.verifyReturningIdentity(request, 'protected');
        } else if (preVerify && limit){
            this._logger("Guard verifying a retuning user for limited route: " + request.originalUrl );
            return this._guardSquad.verifyReturningIdentity(request, 'limited');
        } else {
            this._logger("Immediate bypass on unprotected route " + request.originalUrl );
            return {pass: true};
        }  
    } catch (e) {
        console.log(e);
    }
    
}

// @stub  method
EntryControl.prototype.gatewayInspection = function(request) {
    return true;
}

EntryControl.prototype._logger = function(message) {
    if(this.config.logging == true) {
        console.log(new Date() + " 🚔  EntryControl :: " + message);
    }
}

function GuardCommand(protocols, config) {
    this.squad = this._createForce(protocols);
    this.config = config;
    this.signingSignature = uuid.v4();
    this.keyVault = {}; 
}

GuardCommand.prototype._createForce = function(protocols) {
    var self = this;
    var activateGuards = [];
    
    protocols.forEach(function(protocol) {
         switch(protocol) {
            case "password":
                activateGuards.push(self._passwordGuard);
                break;
            case "ip":
                activateGuards.push(self._ipGuard);
                break;
            default:
                self._logger("problem creating guard for assignment type: " + type);
                break;
         }
    });
       
    return { 
        guardsOnDuty: activateGuards,
        verifyNewIdentity: function(request, level) {
            var decision = false;
            // bind self to the scopes
            if (request.isAuthenticated()) {
                self._logger("User is returning from a passport login.");
                decision = true;
            } else {
                self._logger("User not passport")
                self.squad.guardsOnDuty.forEach(function(guard) {
                    decision = guard.verifyIdentity.call(self,request);
                }, self);
            }
            
            if(decision && level == 'protected') {
                return {pass: true, token: self._generateNewToken(request) };
            } else if( decision && level == 'limited' ) {
                return {pass: true, token: self._generateNewToken(request) };
            } else if ( level == 'limited' ){
                return {pass: true, noToken: true}
            } else {
                // passes did not check out
                return {pass: false };
            }
            
        }, 
        verifyReturningIdentity: function(request, level) {
            var decision = false;
            var decision = self._verifyGivenToken.call(self,request.cookies.BIDS_ENTRY_CONTROL_TOKEN);
            if(decision) {
                // returning token valid
                return {pass: true, token: request.entryControlToken}
            } else {
                // token invalid, try for new one
                var that = self;
                return that.squad.verifyNewIdentity(request, level);
            }
        }
    };
}

// @stub
GuardCommand.prototype._passwordGuard = {
    verifyIdentity: function(request) {
        this._logger("implementing password guard verification");
        return true;
    },
    performInspection: function(request) {
        this._logger("implementing password guard verification");
        return true;
    }
}

GuardCommand.prototype._ipGuard = {
     verifyIdentity: function(request) {
        this._logger("implementing ip guard verification");
        var pass = this.config.allowedIpRange.indexOf(request.connection.remoteAddress) != -1;
        if (pass) {
            this._logger("ip identity verified");
        } else {
            this._logger("ip identity not verified")
        }
        return pass;
    },
    performInspection: function(request) {
        this._logger("implementing ip guard verification");
        return true;
    }
}

GuardCommand.prototype._verifyGivenToken = function(token) {
    var self = this;
    var isValid = false;
    try {
        var decoded = jwt.verify(token, self.signingSignature, { algorithm: self.tokenAlgorithm });
        isValid = self.keyVault[decoded.key] == decoded.value ? true : false;
    } catch(err) {
        this._logger("signing error or warning:")
        console.log(err)
    }
    if(isValid){
        this._logger("Returning User Validated");
    } else {
        this._logger("Returning User NOT validated");
    }
    return isValid;  
}

GuardCommand.prototype._generateNewToken = function(request) {
    var self = this;
    self._logger("generating a new token for verified user ");
    switch (self.config.tokenType) {
        case 'jwt-random':
                var unique_value = uuid.v4();
                var unique_key = uuid.v4();
                var expire = new Date();
                expire.setMinutes(expire.getMinutes() + 30);
                
                var token = jwt.sign({ 
                    key: unique_key,
                    value: unique_value,
                    expire: expire
                }, self.signingSignature,
                { algorithm: self.tokenAlgorithm });
                
                self.keyVault[unique_key] = unique_value;
                return token;
        case 'jwt-password':
            // TODO create password checks 
            break;
        default:
            throw new Error("Cannont Generate New Token, no token type match");

    };
   
}

GuardCommand.prototype._logger = function(message) {
    if(this.config.logging == true) {
        console.log(new Date() + " 🚔  EntryControl ==> 👮  GuardCommand Logger :: " + message);
    }
}

module.exports = EntryControl;