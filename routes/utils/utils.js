//******************************************
// utils . JS
//      
// helper functions
// authored by Brandt Heisey && Rambo
// 02/26/2016
//******************************************

var _       = require('lodash');
var config  = require('../../config/settings.js');
var async   = require('asyncawait/async');
var await   = require('asyncawait/await');
var request = require('request');
var pg      = require('pg');

var env =  process.env.NODE_ENV || "development";
var db = require('../../knexfile')[env].connection;

var conString = `postgres://${db.user}:${db.password}@${db.host}/${db.database}`;

var  crypto = require('crypto');

function checksum (str) {
    //DEBUGGING HINT: does the change you just made ACTUALLY appear in the results set (before and after)
    //      take a carefull look at the search terms before trying to debug
    //      a good way to see if this is happening correctly is to see the string 
    //             length of the WHOLE leads object returned obj.toString().length
    //      if that number doesn't change when you manipulate a lead then the checksum will "likely"
    //              be the same
    
    return crypto
        .createHash('sha512')
        .update(str.toString(), 'utf8')
        .digest('hex')
}

function compare_checksums(newData,oldData){
    var results = false;

    var newHash = checksum(newData);

    if ( newHash === oldData ){ results = true; }

    return results;
}

function convertSectors(givenSector) {
    var retSector;

    var agriculture = [
        'Agricultural extension and research',
        'Crops',
        'General agriculture, fishing and forestry sector',
        'Agriculture, Forestry, Fishing and Hunting',
        'Agriculture, Forestry, Fishing and Hunting',
        'Animal production',
        'Forestry',
        'Irrigation and drainage',
        'Agro-industry, marketing, and trade',
        'Petrochemicals and fertilizers',
        '(Historic)Environment adjustment',
        'Agriculture'
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
        'Mining, Quarrying, and Oil and Gas Extraction',
        'Mining, Quarrying, and Oil and Gas',
        'Extraction'
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
        'Utilities',
        'Services'
	];

	var administrativeWaste = [
        'Sanitation',
        'Wastewater Treatment and Disposal',
        'Solid waste management',
        'Administrative and Support and Waste Management and Remediation Services',
        'Administrative and Support and Waste',
        'Management and Remediation Services',
        'Waste Management and Remediation Services'
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
      'Professional, Scientific, and Technical Services',
      'Professional, Scientific, and Technical'
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
        
        if(value && value != "" && value.length > 0) {
            var check = value.indexOf(givenSector);
            if (check != -1) {
                retSector = key;
            }
        }
    })
    
    if(!retSector) {
        retSector = "Other";
        console.log("No Sector Match - using Other")
        console.log(givenSector)
    }
    
    return retSector;
}

function convertCountry(country) {
    return new Promise((resolve, reject) => {
        try {
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
                            
                            pg.connect(conString, function(err, client, done) {
                                if(err) {
                                    console.log("Convert country Error");
                                    reject(err)
                                }
                                client.query(`SELECT id, website FROM countries WHERE geounit ILIKE '${googCountryName.trim().replace('\'','\'\'')}'`, function(err, result) {
                                    done();
                                    if(err) {
                                        console.log("Select country error");
                                        reject(err)
                                    }
                                    if (!result.rows[0]) { 
                                        console.log("1")
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
                            console.log("2")
                            // this is not a country (at least not recognized by google)
                            resolve(false)
                        }
                    } else {
                        console.log("2")
                        // google found nothing
                        resolve(false);
                    }
                })
            }, 300);
        
        } catch (e) {
            console.log(e);
            reject(e)
        }
       
    });
}

function insertManyToMany(lead, countryID) {
    return new Promise((resolve, reject) => {
        var iquery = "";
        // sectors 

        
        // single country
        iquery += `INSERT INTO leads_countries(lead_fid, country_id)VALUES (${lead}, ${countryID});`;
        console.log("QUERY ===============================");
        console.log(iquery);
         pg.connect(conString, function(err, client, done) {
            if(err) {
                reject(err)
            }
            client.query(iquery, function(err, result) {
                done();
                if(err) {
                    console.log("Many 2 many error countries");
                    reject(err);
                }
                resolve(true);
            });
        });

    });
}

// TODO: Modify with new data fields
function insertLeadObject(data) {
    return new Promise((resolve, reject) => {
        try {
            function strip(phrase) {
                return phrase.trim().replace(`''`,`'`).replace(`'`,`''`);
            }
            console.log("DATA ========================================== DATA")
            console.log(data.locations)
            var opp_unit            = !data.opp_unit            ? "JEDV" : strip(data.opp_unit);
            var project_title       = !data.project_title       ? "NO TITLE" : strip(data.project_title);
            var project_description = !data.project_description ? "NO DESC" : strip(data.project_description);
            var total_amount        = !data.total_amount        ? 1000 : strip(data.total_amount);
            var appropriation_year  = !data.appropriation_year  ? null : strip(data.appropriation_year);
            var obligation_year     = !data.obligation_year     ? null : strip(data.obligation_year);
            var fund_source         = !data.fund_source         ? "JEDV" : strip(data.fund_source);
            var implementing_partner= !data.implementing_partner? null : strip(data.implementing_partner);
            var award_number        = !data.award_number        ? null : strip(data.award_number);
            var fund_mechanism      = !data.fund_mechanism      ? null : strip(data.fund_mechanism);
            var perform_start_date  = !data.perform_start_date  ? null : strip(data.perform_start_date);
            var perform_end_date    = !data.perform_end_date    ? null : strip(data.perform_end_date);
            var region              = !data.region              ? null : strip(data.region);
            var sub_region          = !data.sub_region          ? null : strip(sub_region);
            var locations           = { "data": data.locations };
            var project_theme       = !data.project_theme       ? null : strip(data.project_theme);
            var project_pocs        = !data.project_pocs        ? null : strip(data.project_pocs);
            var public_website      = !data.public_website      ? null : strip(data.public_website);

            var cleared             = (data.cleared == '1' || data.cleared == 'true' || data.cleared == 'TRUE') ? true : true;
            var archived            = (data.archived == '1' || data.archived == 'true' || data.cleared == 'TRUE') ? true : false;

            var queryText = `INSERT INTO leads(
            opp_unit, project_title, project_description, total_amount, appropriation_year, obligation_year,
            fund_source, implementing_partner, award_number, fund_mechanism, perform_start_date, perform_end_date, region, sub_region,
            locations, project_theme, project_pocs, public_website, cleared, archived, auto_archive_date, the_geom)
                VALUES (
                    $1, $2, $3, $4, 
                    $5, $6, $7, $8, $9, 
                    $10, $11, $12, $13, $14, 
                    $15, $16, $17, $18, 
                    $19, $20, $21, $22
                )
                RETURNING fid;`;
            var queryValues = [
                opp_unit, project_title, project_description, total_amount, appropriation_year, obligation_year,
                fund_source, implementing_partner, award_number, fund_mechanism, perform_start_date, perform_end_date,
                region, sub_region, JSON.stringify(locations), project_theme, project_pocs, public_website, cleared, archived, null, null
            ];

            var queryConfig = {
                text: queryText,
                values: queryValues
            };

            
            pg.connect(conString, function(err, client, done) {
                if(err) {
                    reject(err)
                }

                client.query(queryText,queryValues, function(err, result) {
                    done();
                    if(err) {
                        console.log(err);
                        console.log(" -- INSERT BULK CSV ERROR --");
                        console.log("REJECTING THIS INSERT")
                        console.log(reject)
                        reject(err);
                    } else {
                        console.log("SHOULD NOT BE LOGGING")
                        console.log(result);

                        insertManyToMany(result.rows[0].fid, data.locations[0].country_id)
                            .then(()=>{
                                console.log("resolving true -- complete")
                                resolve(true)
                            })
                            .catch((err)=>{
                                console.log(" -- INSERT BULK CSV m2m ERROR --");
                                reject(err);
                            });
                    }
                    

                });
            });
        } catch (e) {
            console.log(e);
            reject(e);
        }
        
    });
}

var transformLeadObject = async( data => {
    return new Promise((resolve, reject) => {
        try {
            var transformed = {};

            transformed.data = data;
            transformed.data.locations = [];
            
            var countryCheck = await (convertCountry(data.country));
            if (!countryCheck) {
                transformed.failed = true;
                resolve(transformed)
            }
            
            transformed.data.locations.push(countryCheck);
  
            resolve(transformed);
        } catch (e) {
            console.log(e);
            reject(e)
        }
        
    });  
});

var ingestLeadData = async(collection => {
    return new Promise((resolve, reject) => {
        var transformedArray = [];
        try{
            
            // transformation
            _.forEach(collection, function(obj) {
                try {
                    var transformed = await ( transformLeadObject(obj) );
                    transformedArray.push(transformed.data)
                } catch (e){
                    console.log("exit premature, transformation failed")
                    resolve(true);
                }
            });
            
            // insert
            _.forEach(transformedArray, function(obj) {
                await (insertLeadObject(obj) );
            })
            
        } catch(e){
            console.log(e);
            reject(e)
        }
        
        resolve(true);
    });
})


module.exports = {
    checksum: checksum,
    compare_checksums: compare_checksums,
    ingestLeadData: ingestLeadData
}