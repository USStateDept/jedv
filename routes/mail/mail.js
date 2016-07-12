//******************************************
// MAIL . JS
//      
// all email and subscription functions
// authored by Brandt Heisey
// 02/22/2016
//******************************************

var nodemailer   = require('nodemailer');
var sesTransport = require('nodemailer-ses-transport');
var config       = require('../../config/settings.js');
var mailConf     = config.mail_settings;

function do_newLeadAdded(cc,html){
    send_mail(cc,html);
}

function do_newLeadsAdded(){

}

function do_subscribeSearch(){

}

function do_subscribeItem(){

}

function load_template(){

}

function send_mail(cc,html){
    console.log("mail conf ",mailConf);
    var transport = nodemailer.createTransport(sesTransport({
        accessKeyId: mailConf.ses_conf.accessKeyId,
        secretAccessKey: mailConf.ses_conf.secretAccessKey,
        rateLimit: 5 // do not send more than 5 messages in a second
    }));
    
    transport.sendMail({
        from: 'heiseybj@state.gov',
        to: 'BIDS-Mailbox@state.gov',
        cc:cc,
        subject: 'BIDS Submission',
        html: html
        //text: 'a long string of seemingly random words and phrases that magically make up a perfectly sensical sfsdgsdgdgsgs'
    },function(err,info){
        console.log("email output    --- ",err,info);
    });

}

module.exports.mail = {
    send_mail: send_mail,
    do_newLeadsAdded: do_newLeadsAdded,
    do_newLeadAdded: do_newLeadAdded,
    do_subscribeSearch:do_subscribeSearch,
    do_subscribeItem: do_subscribeItem
}