var exporter = require('pg-json-data-export');
var path = require('path');
var fs = require("fs");

var PATH_TO_LEADS_OUTPUT =  path.resolve(__dirname,'seeds/data/leads.json');
var PATH_TO_LEADS_COUNTRIES = path.resolve(__dirname,'seeds/data/leads_countries.json');
var PATH_TO_LEADS_SECTORS = path.resolve(__dirname,'seeds/data/leads_sectors.json');
var PATH_TO_COUNTRIES = path.resolve(__dirname,'seeds/data/countries.json');

var env =  process.env.NODE_ENV || "development";
var connection = require('../knexfile')[env];

exporter.toJSON(connection, 'public')
    .then(function (dump) {
        fs.writeFile(PATH_TO_LEADS_OUTPUT, JSON.stringify(dump.leads.rows), (err) => {
            if (err) throw err;
            console.log("successfully wrote Leads!");
            fs.writeFile(PATH_TO_LEADS_COUNTRIES, JSON.stringify(dump.leads_countries.rows), (err) => {
                if (err) throw err;
                console.log("successfully wrote Leads/Countries Junction!");
                fs.writeFile(PATH_TO_LEADS_SECTORS, JSON.stringify(dump.leads_sectors.rows), (err) => {
                    if (err) throw err;
                    console.log("successfully wrote Leads/Sectors Junction!");
                    fs.writeFile(PATH_TO_COUNTRIES, JSON.stringify(dump.countries.rows), (err) => {
                        if (err) throw err;
                        console.log("successfully wrote Countries!");
                    });
                });
            });
        });
  });
