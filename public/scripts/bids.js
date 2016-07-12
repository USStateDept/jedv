/*-----------------------------------------*/
/*-----------------------------------------*/
//               FUNCTIONS                 //
/*-----------------------------------------*/
/*-----------------------------------------*/
cloneCount=1;
tokenUser = false;

    $(document).ready(function() {
      $(".map-alerts").fadeTo(2000, 500).slideUp(500, function(){
        $(".map-alerts").alert('close');
      });
      $.getJSON("/api/countries")
      .done(function(response){
        _.each(response,function(item){
          $("#country-input").append("<option nam='" + item.geounit + "' value='" + item.id + "' iso2='"+item.iso_a2+"'>" + item.geounit + "</option>");
        });
      });
    });

    jQuery.validator.addMethod("govEmails", function (value, element) {
      switch (value.substring(((value.length) - 4), value.length)) {
        case ".gov":
          return true;
        case ".sbu":
          return true;
        case ".mil":
          return true;
        default:
          return false;
      }

    }, "Please use an email address ending in \".gov\", \".sbu\", or \".mil\" .");

    function cloneDropdown(){
      $("#country-input").clone().attr('id', 'country-input'+ cloneCount++).val("").insertAfter("#country-input");
    }

    function do_geocoding(){
      var address = $("#proj_user_location").val();
      if ( address.length > 3 ){
        var adj_address = address.replace(" ","+");
        $.getJSON("https://maps.googleapis.com/maps/api/geocode/json?address="+adj_address+"&key=AIzaSyCv57m0xvjblBbJPt1v0ut_wx9jNKTlelw")
        .done(function(response){
          $("#location_details").html("");
          if(response.status == "OK"){
            var list = "";
            for ( var i = 0; i < response.results.length; i++ ){
              list = "<option>"+response.results[i].formatted_address+"</option>";
            }
            $("#location_details").append("<select>"+list+"</select>");
          }
        });
      }
    }



    function do_geocoding_lookup(){
      var address = $("#proj_user_location").val();
      var adj_address = address.replace(" ","+");
      $.getJSON("https://maps.googleapis.com/maps/api/geocode/json?address="+adj_address+"&key=AIzaSyCv57m0xvjblBbJPt1v0ut_wx9jNKTlelw")
      .done(function(response){
        if(response.status == "OK"){
          if ( response.results.length === 1 ) {
            var country = find_country(response.results[0]);
            var iso = find_iso(response.results[0]);
            //$("#proj_country").val(country);
            $("#proj_address_lat").val(response.results[0].geometry.location.lat);
            $("#proj_address_lng").val(response.results[0].geometry.location.lng);
            $("#proj_user_location").val(response.results[0].formatted_address);

            $("#proj_iso").val(iso);
            $('#country-input option[iso2="' + iso + '"]').attr('selected',true);
            $("#country_id").val($( "#country-input option:selected").val());
            $("#country_name").val($("#country-input option:selected").text());
            $("#proj_country").val(country);
            console.log("uju");
            console.log(response);

          } else if ( response.results.length > 1 ){
            var list = "";
            for ( var i = 0; i < response.results.length; i++ ){
              var country = find_country(response.results[i]);
              var iso = find_iso(response.results[i]);
              list += "<option data-country='"+country+"' data-iso='" + iso + "' data-loc='{\"lat\":"+response.results[i].geometry.location.lat+",\"lng\":"+response.results[i].geometry.location.lng+"}'>"+response.results[i].formatted_address+" ("+ country+")</option>";
            }
            $("#lookup-results").append("<select id='resultsList'><option></option>"+list+"</list>");
            $("#lookup-results").show();

            $("#resultsList").on("change",function(){
              var selected = $("option:selected",this);
              var loc = selected.data("loc");
              var country = selected.data("country");
              var iso = selected.data("iso");
              $("#proj_country").val(country);
              $("#proj_address_lat").val(loc.lat);
              $("#proj_address_lng").val(loc.lng);
              $("#proj_user_location").val(selected.text());
              $("#proj_iso").val(iso);
              $('#country-input option[iso2="' + iso + '"]').attr('selected',true);
              $("#country_id").val($( "#country-input option:selected").val());
              $("#country_name").val($("#country-input option:selected").text());

            });
          }
        }
      });
    }

    function find_iso(response){
      for( var i = 0; i < response.address_components.length; i++ ){
        if ( response.address_components[i].types.indexOf("country") != -1 ){
          return response.address_components[i].short_name
        }
      }
    }

    function find_country(response){
      for( var i = 0; i < response.address_components.length; i++ ){
        if ( response.address_components[i].types.indexOf("country") != -1 ){
          return response.address_components[i].long_name
        }
      }
    }

    /*var googlecountries = {
      "AF":"Afghanistan",
      "AL":"Albania",
      "DZ":"Algeria",
      "AS":"American Samoa",
      "AD":"Andorra",
      "AO":"Angola",
      "AI":"Anguilla",
      "AQ":"Antarctica",
      "AG":"Antigua & Barbuda",
      "AR":"Argentina",
      "AM":"Armenia",
      "AW":"Aruba",
      "AC":"Ascension Island",
      "AU":"Australia",
      "AT":"Austria",
      "AZ":"Azerbaijan",
      "BS":"Bahamas",
      "BH":"Bahrain",
      "BD":"Bangladesh",
      "BB":"Barbados",
      "BY":"Belarus",
      "BE":"Belgium",
      "BZ":"Belize",
      "BJ":"Benin",
      "BM":"Bermuda",
      "BT":"Bhutan",
      "BO":"Bolivia",
      "BA":"Bosnia & Herzegovina",
      "BW":"Botswana",
      "BV":"Bouvet Island",
      "BR":"Brazil",
      "IO":"British Indian Ocean Territory",
      "VG":"British Virgin Islands",
      "BN":"Brunei",
      "BG":"Bulgaria",
      "BF":"Burkina Faso",
      "BI":"Burundi",
      "KH":"Cambodia",
      "CM":"Cameroon",
      "CA":"Canada",
      "IC":"Canary Islands",
      "CV":"Cape Verde",
      "BQ":"Caribbean Netherlands",
      "KY":"Cayman Islands",
      "CF":"Central African Republic",
      "EA":"Ceuta & Melilla",
      "TD":"Chad",
      "CL":"Chile",
      "CN":"China",
      "CX":"Christmas Island",
      "CP":"Clipperton Island",
      "CC":"Cocos (Keeling) Islands",
      "CO":"Colombia",
      "KM":"Comoros",
      "CD":"Congo (DRC)",
      "CG":"Congo (Republic)",
      "CK":"Cook Islands",
      "CR":"Costa Rica",
      "HR":"Croatia",
      "CU":"Cuba",
      "CW":"Curaçao",
      "CY":"Cyprus",
      "CZ":"Czech Republic",
      "CI":"Côte d’Ivoire",
      "DK":"Denmark",
      "DG":"Diego Garcia",
      "DJ":"Djibouti",
      "DM":"Dominica",
      "DO":"Dominican Republic",
      "EC":"Ecuador",
      "EG":"Egypt",
      "SV":"El Salvador",
      "GQ":"Equatorial Guinea",
      "ER":"Eritrea",
      "EE":"Estonia",
      "ET":"Ethiopia",
      "FK":"Falkland Islands (Islas Malvinas)",
      "FO":"Faroe Islands",
      "FJ":"Fiji",
      "FI":"Finland",
      "FR":"France",
      "GF":"French Guiana",
      "PF":"French Polynesia",
      "TF":"French Southern Territories",
      "GA":"Gabon",
      "GM":"Gambia",
      "GE":"Georgia",
      "DE":"Germany",
      "GH":"Ghana",
      "GI":"Gibraltar",
      "GR":"Greece",
      "GL":"Greenland",
      "GD":"Grenada",
      "GP":"Guadeloupe",
      "GU":"Guam",
      "GT":"Guatemala",
      "GG":"Guernsey",
      "GN":"Guinea",
      "GW":"Guinea-Bissau",
      "GY":"Guyana",
      "HT":"Haiti",
      "HM":"Heard & McDonald Islands",
      "HN":"Honduras",
      "HK":"Hong Kong",
      "HU":"Hungary",
      "IS":"Iceland",
      "IN":"India",
      "ID":"Indonesia",
      "IR":"Iran",
      "IQ":"Iraq",
      "IE":"Ireland",
      "IM":"Isle of Man",
      "IL":"Israel",
      "IT":"Italy",
      "JM":"Jamaica",
      "JP":"Japan",
      "JE":"Jersey",
      "JO":"Jordan",
      "KZ":"Kazakhstan",
      "KE":"Kenya",
      "KI":"Kiribati",
      "XK":"Kosovo",
      "KW":"Kuwait",
      "KG":"Kyrgyzstan",
      "LA":"Laos",
      "LV":"Latvia",
      "LB":"Lebanon",
      "LS":"Lesotho",
      "LR":"Liberia",
      "LY":"Libya",
      "LI":"Liechtenstein",
      "LT":"Lithuania",
      "LU":"Luxembourg",
      "MO":"Macau",
      "MK":"Macedonia (FYROM)",
      "MG":"Madagascar",
      "MW":"Malawi",
      "MY":"Malaysia",
      "MV":"Maldives",
      "ML":"Mali",
      "MT":"Malta",
      "MH":"Marshall Islands",
      "MQ":"Martinique",
      "MR":"Mauritania",
      "MU":"Mauritius",
      "YT":"Mayotte",
      "MX":"Mexico",
      "FM":"Micronesia",
      "MD":"Moldova",
      "MC":"Monaco",
      "MN":"Mongolia",
      "ME":"Montenegro",
      "MS":"Montserrat",
      "MA":"Morocco",
      "MZ":"Mozambique",
      "MM":"Myanmar (Burma)",
      "NA":"Namibia",
      "NR":"Nauru",
      "NP":"Nepal",
      "NL":"Netherlands",
      "NC":"New Caledonia",
      "NZ":"New Zealand",
      "NI":"Nicaragua",
      "NE":"Niger",
      "NG":"Nigeria",
      "NU":"Niue",
      "NF":"Norfolk Island",
      "KP":"North Korea",
      "MP":"Northern Mariana Islands",
      "NO":"Norway",
      "OM":"Oman",
      "PK":"Pakistan",
      "PW":"Palau",
      "PS":"Palestine",
      "PA":"Panama",
      "PG":"Papua New Guinea",
      "PY":"Paraguay",
      "PE":"Peru",
      "PH":"Philippines",
      "PN":"Pitcairn Islands",
      "PL":"Poland",
      "PT":"Portugal",
      "PR":"Puerto Rico",
      "QA":"Qatar",
      "RO":"Romania",
      "RU":"Russia",
      "RW":"Rwanda",
      "RE":"Réunion",
      "WS":"Samoa",
      "SM":"San Marino",
      "SA":"Saudi Arabia",
      "SN":"Senegal",
      "RS":"Serbia",
      "SC":"Seychelles",
      "SL":"Sierra Leone",
      "SG":"Singapore",
      "SX":"Sint Maarten",
      "SK":"Slovakia",
      "SI":"Slovenia",
      "SB":"Solomon Islands",
      "SO":"Somalia",
      "ZA":"South Africa",
      "GS":"South Georgia & South Sandwich Islands",
      "KR":"South Korea",
      "SS":"South Sudan",
      "ES":"Spain",
      "LK":"Sri Lanka",
      "BL":"St. Barthélemy",
      "SH":"St. Helena",
      "KN":"St. Kitts & Nevis",
      "LC":"St. Lucia",
      "MF":"St. Martin",
      "PM":"St. Pierre & Miquelon",
      "VC":"St. Vincent & Grenadines",
      "SD":"Sudan",
      "SR":"Suriname",
      "SJ":"Svalbard & Jan Mayen",
      "SZ":"Swaziland",
      "SE":"Sweden",
      "CH":"Switzerland",
      "SY":"Syria",
      "ST":"São Tomé & Príncipe",
      "TW":"Taiwan",
      "TJ":"Tajikistan",
      "TZ":"Tanzania",
      "TH":"Thailand",
      "TL":"Timor-Leste",
      "TG":"Togo",
      "TK":"Tokelau",
      "TO":"Tonga",
      "TT":"Trinidad & Tobago",
      "TA":"Tristan da Cunha",
      "TN":"Tunisia",
      "TR":"Turkey",
      "TM":"Turkmenistan",
      "TC":"Turks & Caicos Islands",
      "TV":"Tuvalu",
      "UM":"U.S. Outlying Islands",
      "VI":"U.S. Virgin Islands",
      "UG":"Uganda",
      "UA":"Ukraine",
      "AE":"United Arab Emirates",
      "GB":"United Kingdom",
      "US":"United States",
      "UY":"Uruguay",
      "UZ":"Uzbekistan",
      "VU":"Vanuatu",
      "VA":"Vatican City",
      "VE":"Venezuela",
      "VN":"Vietnam",
      "WF":"Wallis & Futuna",
      "EH":"Western Sahara",
      "YE":"Yemen",
      "ZM":"Zambia",
      "ZW":"Zimbabwe",
      "AX":"Åland Islands"
    }*/
