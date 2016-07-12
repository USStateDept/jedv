/**
 * BIDS Update World Bank Data
 * 
 * 
 * Notes:
 *  - AWS Lambda Function
 *  - Logging availible in AWS CloudWatch
 * 
 */
"use strict";

var async   = require('asyncawait/async');
var await   = require('asyncawait/await');
var request = require('request');
var _       = require('lodash');
var pg      = require('pg');
var config  = require('./config');


function convertSectors(givenSector) {
    var retSector;
    
    var agriculture = [
        'Agricultural extension and research',
        'Crops',
        'General agriculture, fishing and forestry sector',
        'Agriculture, Forestry, Fishing and Hunting',
        'Animal production',
        'Forestry',
        'Irrigation and drainage',
        'Agro-industry, marketing, and trade',
        'Petrochemicals and fertilizers',
        '(Historic)Environment adjustment'
	];

	var publicAdm = [
        'Central government administration',
        'Compulsory pension and unemployment insurance',
        'Law and justice',
        'Public administration- Education',
        'Public administration- Financial Sector',
        'Public administration- Industry and trade',
        'Public administration- Other social services',
        'Public administration- Water, sanitation and flood protection',
        'Compulsory health finance',
        'General public administration sector',
        'Public administration- Agriculture, fishing and forestry',
        'Public administration- Energy and mining',
        'Public administration- Health',
        'Public administration- Information and communications',
        'Public administration- Transportation',
        'Sub-national government administration',
        'Public Administration'
	];

	var information = [
        'General information and communications sector',
        'Telecommunications',
        'Information technology',
        'Information'
	];

	var education = [
        'Adult literacy/non-formal education',
        'Pre-primary education',
        'Secondary education',
        'Vocational training',
        'General education sector',
        'Primary education',
        'Tertiary education',
        'Educational Services'
	];

	var finance = [
        'Finance and Insurance',
        'Banking',
        'General finance sector',
        'Non-compulsory health finance',
        'Payments, settlements, and remittance systems',
        'Microfinance',
        'Credit Reporting and Secured Transactions',
        'Capital markets',
        'Housing finance',
        'Non-compulsory pensions and insurance',
        'SME Finance',
        'Other non-bank financial intermediaries'
	];

	var health = [
        'Health',
        'Other social services',
        'Health Care and Social Assistance'
	];

	var energy = [
        'Energy efficiency in power sector',
        'Oil and gas',
        'Large Hydropower',
        'Other Renewable Energy',
        'Transmission and Distribution of Electricity',
        'General energy sector',
        'Thermal Power Generation',
        'Coal Mining',
        'Other Mining and Extractive Industries',
        'Hydropower',
        'Energy efficiency in Heat and Power',
        'Mining, Quarrying, and Oil and Gas Extraction'
	];

	var transportation = [
        'Transportation and Warehousing',
        'Aviation',
        'Ports, waterways and shipping',
        'Urban Transport',
        'General transportation sector',
        'Railways',
        'Rural and Inter-Urban Roads and Highways',
        'Other domestic and international trade'
	];

	var utilities = [
        'Flood protection',
        'Water supply',
        'General water, sanitation and flood protection sector',
        'Wastewater Collection and Transportation',
        'Utilities'
	];

	var administrativeWaste = [
        'Sanitation',
        'Wastewater Treatment and Disposal',
        'Solid waste management',
        'Administrative and Support and Waste Management and Remediation Services'
	];

	var other = [
        'Other industry',
        'General industry and trade sector',
        'Undefined'
	];

	var construction = [
	    'Housing construction',
        'Construction'
	];

	var manufacturing = [
        'Manufacturing'
        ];
    
    var tech = [
      'Professional, Scientific, and Technical Services'  
    ];

	var sectors = {
        'Agriculture, Forestry, Fishing and Hunting':agriculture,
        'Public Administration':publicAdm,
        'Construction':construction,
        'Information':information,
        'Educational Services':education,
        'Finance and Insurance':finance,
        'Health Care and Social Assistance':health,
        'Mining, Quarrying, and Oil and Gas Extraction':energy,
        'Manufacturing':manufacturing,
        'Transportation and Warehousing':transportation,
        'Utilities':utilities,
        'Professional, Scientific, and Technical Services':tech,
        'Administrative and Support and Waste Management and Remediation Services':administrativeWaste,
        'Other': other
    };
    
    _.forIn(sectors, (value, key) => {
        var check = value.indexOf(givenSector);
        if (check != -1) {
            retSector = key;
        }
    })
    
    if(!retSector) {
        console.log("No Sector Match")
        console.log(givenSector)
    }
    
    return retSector;
}   

function convertCountry(country) {
    return new Promise((resolve, reject) => {
        var complete = {};
        var googleURL = 'https://maps.googleapis.com/maps/api/geocode/json?&address=';
        var countryEnc = encodeURIComponent(country);
        setTimeout(function() {
            request(googleURL + countryEnc, function (error, response, body) {
                body = JSON.parse(body);
                if (!error && response.statusCode == 200 && body.status != 'ZERO_RESULTS' ) {
                    var googObj         = body.results[0];
                    var extractIndex    = _.findIndex(googObj["address_components"], function(o) { return o.types.indexOf("country") != -1; });
                    if (extractIndex != -1) {
                        var googCountryName = googObj["address_components"][extractIndex]["long_name"];
                    
                        complete.lat = googObj["geometry"]["location"]["lat"];
                        complete.lng = googObj["geometry"]["location"]["lng"];
                        
                        pg.connect(config.db, function(err, client, done) {
                            if(err) {
                                reject(err)
                            }
                            client.query(`SELECT id, website FROM countries WHERE geounit ILIKE '${googCountryName.trim().replace('\'','\'\'')}'`, function(err, result) {
                                done();
                                if(err) {
                                    reject(err)
                                }
                                if (!result.rows[0]) {
                                   // country not in our db
                                   resolve(false);
                                } else {
                                    complete.country_id = result.rows[0].id;
                                    complete.website =  result.rows[0].website;
                                    resolve(complete);
                                }
                            });
                        });
                    } else {
                        // this is not a country (at least not recognized by google)
                        resolve(false)
                    }
                } else {
                    // google found nothing
                    resolve(false);
                }
            })
        }, 300);
        
    });
}

function convertThemes(data) {
    var final = [];
    
    _.forIn(data, function(value, key) {
        if (key == 'theme1' || key == 'theme2' || key == 'theme3' || key == 'theme4' || key == 'theme5'){
            final.push(" "+ value.Name);
        }
    });
    
    return final.toString();
}

// @STUBED Out for now - doing a truncate insert
// function checkDataExistence(data) {
//      return new Promise((resolve, reject) => {
//         // take aspects of the object (maybe world bank id?)
//         // look for a match on that    
//         resolve(false);
//     });
// }

function insertManyToMany(lead, sectors, countryID) {
    return new Promise((resolve, reject) => {
        var iquery = "";
        // sectors 
        _.forEach(sectors, (sec)=>{
           iquery += `
           INSERT INTO leads_sectors(
                lead_fid, sector_id
           ) VALUES (
                ${lead}, (SELECT id FROM SECTORS WHERE sector ~ '${sec.trim().replace('\'','\'\'')}')
            );`;
        });
        
        // single country
        iquery += `INSERT INTO leads_countries(lead_fid, country_id)VALUES (${lead}, ${countryID});`
        
         pg.connect(config.db, function(err, client, done) {
            if(err) {
                reject(err)
            }
            client.query(iquery, function(err, result) {
                done();
                if(err) {
                    reject(err);
                }
                resolve(true);
            });
        });

    });
}

function insertWBObject(data) {
    return new Promise((resolve, reject) => {
        var locObj = {
            "data": data.locations
        }; 
        
        var website = !data.locations[0].website ? null : data.locations[0].website.trim().replace('\'','\'\'');
        var keyword = !data.keyword ? null : data.keyword.trim().replace('\'','\'\'');
        var impagency = !data.impagency ? null : data.impagency.trim().replace('\'','\'\'');
        
        var iquery = 
            `INSERT INTO leads(
                project_title, project_number, project_size, project_description, 
                keyword, source, project_announced, tender_date, implementing_entity, 
                project_pocs, post_comments, submitting_officer, submitting_officer_contact, 
                link_to_project, business_url, cleared, archived, auto_archive_date, 
                the_geom, editable, locations)
            VALUES (
                '${data.project_name.trim().replace('\'','\'\'')}', '${data.id.trim().replace('\'','\'\'')}', '${data.lendprojectcost.trim().replace('\'','\'\'')}', null, 
                '${keyword}', 'World Bank', null, null, '${impagency}', 
                null, null, null, null, 
                '${data.url.trim().replace('\'','\'\'')}', '${website}', true, false, null, 
                null, false, '${JSON.stringify(locObj)}'
            )
            RETURNING fid;`
            

        pg.connect(config.db, function(err, client, done) {
            if(err) {
                reject(err)
            }
            client.query(iquery, function(err, result) {
                done();
                if(err) {
                    console.log(" -- INSERT ERROR --");
                    reject(err);
                }
                
                insertManyToMany(result.rows[0].fid, data.sector, data.locations[0].country_id)
                    .then(()=>{
                        resolve({inserted: true})
                    })
                    .catch((err)=>{
                        console.log(" -- INSERT m2m ERROR --");
                        reject(err);
                    });

            });
        });
        
    });
}

var transformWBObject = async( data => {
    return new Promise((resolve, reject) => {
        var transformed = {};
        
        transformed.data = data;
        transformed.data.locations = [];
        
        var countryCheck = await (convertCountry(data.countryname));
        if (!countryCheck) {
            transformed.failed = true;
            transformed.reason = "Country Name Issue"
            resolve(transformed)
        }
        
        transformed.data.locations.push(countryCheck)
        
        _.forEach(data.sector, (sec,i) => {
            data.sector[i] = convertSectors(sec.Name);
        });
        transformed.data.sector = _.uniq(data.sector);

        transformed.data.keyword = convertThemes(data);

        resolve(transformed)

    });  
});

function truncateWbData() {
    return new Promise((resolve, reject) => {
       pg.connect(config.db, function(err, client, done) {
            if(err) {
                reject(err)
            }
            client.query(`DELETE FROM leads WHERE source ILIKE 'World Bank'`, function(err, result) {
                done();
                if(err) {
                    reject(err)
                }  
                resolve(true);
            });
        });
    });
}

var ingestWBData = async(collection => {
    return new Promise((resolve, reject) => {
        var countComplete   = 0;
        var countIncomplete = 0;
        var processedCount = 0;
        var failedList = [];
        
        if (_.isUndefined(collection)) {
            console.log("❌  LEAD DATA INSERT - Collection Object Empty")
            collection = {count:0};
        } else {
            try{
                var truncated = await(truncateWbData());
                
                _.forEach(collection, function(obj) {
                    processedCount++;
                    // transformation and ingestion
                    var transformed = await ( transformWBObject(obj) );
                    if (!transformed.failed) {
                        
                        // @STUBBED out
                        //var exists = await (checkDataExistence(transformed.data));
                        var exists = false;
                        
                        if (exists) {
                            console.log("❌✅  LEAD DATA INSERT - Failed to DB insert a transformed world bank object")
                            console.log(`==> Lead already exists in database`);
                            console.log(transformed.data.id);
                            failedList.push(transformed.data.id);
                            countIncomplete++;
                        } else {
                            
                            var report = await (insertWBObject(transformed.data) );
                       
                            if ( report.inserted ) {
                                console.log("✅  LEAD DATA INSERT - Inserted a new/transformed world bank object")
                                console.log(transformed.id);
                                countComplete++;
                            } else if (report.noInsertReason) {
                                console.log("❌  LEAD DATA INSERT - Failed to DB insert a transformed world bank object")
                                console.log(`==> ${report.noInsertReason}`);
                                console.log(transformed.data.id);
                                failedList.push(transformed.data.id);
                                countIncomplete++;
                            } else {
                                console.log("❌  LEAD DATA INSERT - Failed to DB insert a transformed world bank object")
                                console.log(`==> Reason not accounted for`);
                                console.log(transformed.data.id);
                                failedList.push(transformed.data.id);
                                countIncomplete++;
                            }
                        } 
                    } else if (transformed.failed){
                        console.log("❌  LEAD DATA INSERT - Failed to transform a new world bank object")
                        console.log(`==> ${transformed.reason}`);
                        console.log(transformed.data.id);
                        failedList.push(transformed.data.id);
                        countIncomplete++;
                    } else {
                        console.log("❌  LEAD DATA INSERT - Failed to transform a new world bank object")
                        console.log(`==> Reason not accounted for`);
                        console.log(transformed.data.id);
                        failedList.push(transformed.data.id);
                        countIncomplete++;
                    }
                });
            } catch(e){
                reject(e)
            }
        }
       
        console.log()
        console.log(`Ingest Function Completed`);
        console.log(`------------------------------------------------------------------------`)
        console.log(`Number of Objects           :: ${processedCount}`);
        console.log(`Number of Processed Objects :: ${collection.length}`);
        console.log(`Number of Inserted Objects  :: ${countComplete}`);
        console.log(`Number of Denied Objects    :: ${countIncomplete}`);
        console.log(`Denied Objects List         :: ${failedList}`);
        console.log();
              
        resolve(true);
    });  
})

function getWBData(url) {
  return new Promise((resolve, reject) => {
    // takes in an object that the world bank provides
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body)
            var data = _.map(body["projects"], function(wb_project_details, wb_project_code) {
               return wb_project_details;
            });
            resolve(data);
        } else {
            reject(error);
        }
    })
    
  }); 
}
  
var __init__ = async( (event, context) => {
    var url = "http://search.worldbank.org/api/v2/projects?format=json&status_exact=Pipeline&source=IBRD&kw=N&rows=500"
    var collection;
    var truncated;
    
    try {
        collection = await ( getWBData(url) );

        ingestWBData(collection)
            .then(done => {
                console.log("-- END -- script completed -- END --");
                console.log();
            })
            .catch(err => {
                console.log(err);
                console.log("-- END -- script errored out -- END --");
                console.log();
            });
    } catch (e) {
        console.log(e)
        console.log("-- END -- script errored out -- END --");
        console.log();
    }

})

exports.BIDS_UPDATE_WB = __init__;

// local test
__init__();