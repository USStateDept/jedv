//testing.js
//

var config = {
  db_settings: {
    //don't specify port as part of the host
    host     : process.env.CI_DB_HOST_NAME,
    user     : process.env.CI_DB_USER_NAME,
    password : process.env.CI_DB_PASSWORD,
    database : process.env.CI_DATABASE,
    charset  : 'utf8',
    debug: true
  },
  mail_settings: {
    type: "ses",
    ses_conf: {
      accessKeyId: process.env.AWS_AKI,
      secretAccessKey: process.env.AWS_SAK
    },
    campaigns: {
      newLeadAdded: {
        active: false,
        type: "ondemand"
      },
      newLeadsAdded: {
        active: false,
        type: "ondemand"
      },
      subscribeSearch: {
        active: false,
        type: "schedule"
      },
      subscribeItem: {
        active: false,
        type: "schedule"
      }
    }
  }
};

module.exports = config;
