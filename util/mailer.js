"use strict";
var util = require('util');


class Mailer {
  constructor() {
    var env =  process.env.NODE_ENV || "development";
    var path = `../config/${env}.js`.toString();

    this.sesSettings = require(path).mail_settings.ses_conf;
    this.aws = require('aws-sdk');
    this.aws.config.update(this.sesSettings);
    this.ses = new this.aws.SES();
  }

  sendVerificationMail(email, verificationToken, host) {
    var ses_mail = "From: 'BIDS registration' <" + this.sesSettings.email + ">\n";
    ses_mail = ses_mail + "To: " + email + "\n";
    ses_mail = ses_mail + "Subject: Thanks for registering for bids.\n";
    ses_mail = ses_mail + "MIME-Version: 1.0\n";
    ses_mail = ses_mail + "Content-Type: text/html; charset=us-ascii\n\n";
    ses_mail = ses_mail + "Please click on the following link to verify your email: \n http://" + host + "/verify_token?token=" + verificationToken + "\n\n";

    var params = {
      RawMessage: { Data: new Buffer(ses_mail) },
      Destinations: [ email ],
      Source: "'AWS Tutorial Series' <" + this.sesSettings.email + ">'"
    };

    this.ses.sendRawEmail(params, function(err, data) {
      if(err) {
        console.log(err);
      }
      else {
        console.log(data);
      }
    });
  }
}

module.exports.mailer = new Mailer();
