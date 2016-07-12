//staging.js
var config = {
  mail_settings: {
    type: "ses",
    ses_conf: {
      accessKeyId: process.env.AWS_AKI,
      secretAccessKey: process.env.AWS_SAK,
      "region": "us-east-1",
      "email": process.env.VALID_SES_EMAIL
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
