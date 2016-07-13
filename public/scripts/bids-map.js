'use strict';

   var moneyFormat = wNumb({
    	prefix: '$',
    	thousand: ','
    });

  var markerClusters = new L.MarkerClusterGroup({
	  spiderfyOnMaxZoom: true,
	  showCoverageOnHover: false,
	  zoomToBoundsOnClick: true,
	  disableClusteringAtZoom: 16
	});

  /*var southWest = L.latLng(-90, -180),
    northEast = L.latLng(90, 180),
    bounds = L.latLngBounds(southWest, northEast);*/

  var map = L.map("map", {
    zoom: 2,
    maxZoom: 14,
    minZoom: 2,
    center: [32.2169, -20.7656],
    layers: [markerClusters],
    zoomControl: false,
    attributionControl: true,
    maxBoundsViscosity: 1.0
     //maxBounds: bounds
  });
  L.control.zoom({
     position:'topright'
  }).addTo(map);


  var detailLayer = L.tileLayer('http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> -- borders shown may not represent official recognized boundries',
  maxZoom: 14,
  continuousWorld:true,
  noWrap:true
  }).addTo(map);

  function showPosition(position) {
    if(!position) {  }
    map.setView(new L.LatLng(position.coords.latitude,
      position.coords.longitude), 3);
  }

  $(document).ready(function(){

    $("body").tooltip({ selector: '[data-toggle=tooltip]' });

    $(window).on("resize", function() {
      $("#map").height($(window).height() - $("#navbar").height()).width($("#mapcol").width());
      map.invalidateSize();
    }).trigger("resize");
  });


/*----------------------------------------------*/
/*----------------------------------------------*/
//         Global State Objects
//         -- markers
//         -- popuparray
//         -- data state object
//
/*----------------------------------------------*/
/*----------------------------------------------*/
// global accessor
var self = this;
var _state = new DataState();

// clustered bids markers
var markers = L.markerClusterGroup({ chunkedLoading: true });

// global array that holds cluster objects/info
var popLayers = []
// global onClick
function popupOnClick(key){
  popLayers[key-1].zoomToBounds()
  map.closePopup();
}

// TraverseCluster class instantiation -------------------------------
function TraverseCluster(cluster) {
  this.baseObject = cluster // initialized with top object
  this.sortedRanks = [] // the array which we will use
}

TraverseCluster.prototype.traverse = function(obj){

  // default param, either its the base, or object in recursion
  var obj = typeof obj !== 'undefined' ?  obj : this.baseObject;

  // cluster object can consist of marker (our hit point),
  // or it can consist of more clusters, in which case we will
  // call this function recursively
  // BASE CASE
  if ( obj._childClusters.length == 0 ) {
    // we have reached our hit point, collect markers
    _.forEach(obj._markers, function(marker, i){
      // HIT POINT
      this.sortedRanks.push(marker.dataObject)
    }, this)
  } else {
    // there are child clusters, but we also need to see if there are
    // markers to collect before traversing clusters
    if ( obj._markers.length != 0) {
      _.forEach(obj._markers, function(marker, i){
        this.sortedRanks.push(marker.dataObject)
      },this)
    }
    // now traverse child clusters
    _.forEach(obj._childClusters, function(cluster, i){
      // we must now recursivley iterate the depths
      // RECURSION
      this.traverse(cluster);
    },this)
  }

  // return a sorted array
  return _.sortBy(this.sortedRanks, function(o) { return parseInt(o.project_size); });
}
// -------------------------------------------------------------------

// Summary Project Modal Class ---------------------------------------
function SummaryModal(project) {

  this.elemID = project.fid
  this.title = project.project_title
  this.country = project.country
  this.date_added = project.project_announced
  this.funding_source = project.funding_source
  this.size = project.project_size
  this.status = project.status
  this.description = project.project_description
  this.website = project.link_to_project
  this.contact = project.submitting_officer_contact
  this.sector = project.sectors_names.toString();
  // more accessible variables can go here, even the whole object
}

SummaryModal.prototype.buildSummary = function(){
  // decide whether or not to create a web link
  var webLink = (this.website != undefined ? "<a href='"+this.website+"' target='_blank'>website</a>" : "<p>no website</p>")
  // decide whether or not to create a contact link
  var contactLink = (this.contact != undefined ? "<a href='mailto:"+this.contact+"'>contact</a>" : "<p>no contact</p>")
  // summary modal
  var modalHTML = '' +
    '<div id="'+this.elemID+'" class="modal fade" data-remote="true" role="dialog">' +
        '<div class="modal-dialog">' +
           '<div class="modal-content">' +
            '<div class="modal-header">'+
              '<button type="button" class="close" data-dismiss="modal">&times;</button>'+
              '<h4 class="modal-title">'+ this.title +'</h4>'+
            '</div>' +

            '<div class="modal-body">' +
              '<ul class="map-project-details">' +
                '<li><b>Country:</b> '+this.country+'</li>' +
                '<li><b>Sector(s):</b> '+this.sector+'</li>' +
                '<li><b>Date Added:</b> '+this.date_added+'</li>' +
                '<li><b>Implementing Entity:</b> '+this.implementing_entity+'</li>' +
                '<li><b>Project Size:</b> '+this.size+'</li>' +
              '</ul>' +

              '<p>Description:<br/>'+this.description+'</p>' +

              '<ul class="map-pjt-links">' +
                '<li>'+webLink+'</li>' +
                '<li>'+contactLink+'</li> ' +
              '</ul>' +

            '</div>' +

            '<div class="modal-footer">'+
              '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'+
            '</div>'+

          '</div>' +
        '</div>' +
      '</div>';

    $('.main-body').prepend(modalHTML)
}
// global open funciton
function openSummary(id){
  var result = $.grep(_state.data, function(e){ return e.fid == id; });
  var data = createSingleObjArray(result[0]);
  poulateDetailedEntryView(data);
}
//  ------------------------------------------------------------------


/**
 * Create popups on cluster hover
 * calls classes: TraverseCluster, SummaryModal
 */
markers
  .on('clustermouseover', function(c) {

    // push into our onclick popups array
    var key = popLayers.push(c.layer)
    // instaniate a new TraversableCluster class
    var tc = new TraverseCluster(c.layer)
    // get the sorted ranks
    var sortedRanks = tc.traverse()
    // limit will be top 5, unless there are not 5 results

    var limit=0;

    /////////Fix for the gray box on the map
    //If the latitude is greater than 35N and the map is zoomed all
    //the way in, show only 3 largest projects instead of 5 (making the popup a smaller size)

    if (c.layer.getLatLng().lat > 35 && c.layer._map._zoom == 2)
      limit = sortedRanks.length >= 3 ? 3 : sortedRanks.length
    else
      limit = sortedRanks.length >= 5 ? 5 : sortedRanks.length

    // create rank html for popup
    var rankHtml = "<div class='popup-rank'><h5>"+limit+" Largest Projects</h5>"

    // reverse for loop to create body html
    for (var i = sortedRanks.length - 1; i >= sortedRanks.length - limit; i--) {
      // actually builds the summary modal
      var sm = new SummaryModal(sortedRanks[i])
      sm.buildSummary()
      // expand the current cluster
      var elemID = sortedRanks[i].fid
      // add the individual project title and size

      var spanElement = $('<span></span>', {
        'id':'myDiv' + elemID,
        'class':'map-text-button popup-pjt-title',
        'onclick': 'openSummary(' + elemID + ')',
        'text': sortedRanks[i].project_title
      }).data("data", sortedRanks[i]);
      spanElement.append( $('<p>').text(sortedRanks[i].countries_names.toString().replace(/,/g," & ")));
      spanElement.append( $('<p>').text(nFormatter(parseInt(sortedRanks[i].project_size.replace (/,/g, ""),10), 2)));
      rankHtml += '<br/>' + spanElement[0].outerHTML;
    }

    // create base popup
    var popup = L.popup({
      className: 'popup-summary'
    })
      .setLatLng(c.layer.getLatLng())
      .setContent(rankHtml + '</div>' +
        '<br/><span class="map-text-button" onClick="popupOnClick(\''+key+'\')">See More</span>'
      )
      .openOn(map);
  })
  .on('clusterclick',function(c){
       map.closePopup();
  });


build_sectors_filter();
build_countries_filter();
build_regions_filter();


//set the left margin on the second tooltip

$('[data-toggle="tooltip"]').tooltip();
$("#search-input").select2({
  tags: true,
  tokenSeparators: [','],
  placeholder: "Search for a lead"
}).
on("change",function(e){
  _state.setFilter('search-terms',$("#search-input").val(), false);
});

/*-----------------------------------------*/
/*-----------------------------------------*/
//               EVENTS                    //
/*-----------------------------------------*/
/*-----------------------------------------*/

$('#filterMinSize').on('change', function(){
  var newVal = parseInt(this.value, 10);
  _state.setFilter('size-min',newVal, false);
});

$('#filterMaxSize').on('change', function(){
  var newVal = parseInt(this.value, 10);
  _state.setFilter('size-max',newVal, false);
});


/*
Opens and closes the flyaway menu
*/
$('#opener').on('click', function() {
  var panel = $('#slide-panel');
  var map = $('#map');
  var slider = $("#leads_value_slider");

  if (panel.hasClass("visible")) {
    panel.removeClass('visible').animate({'margin-left':'-330px'});
    panel.css("zIndex",-10);
    slider.hide();
  } else {
    panel.css("zIndex",10);
    panel.addClass('visible').animate({'margin-left':'0px'});
    slider.show();
  }
  return false;
});

//Used for toggling between the different ways to browse and filter for countries (alphabetically and by region)
function toggleActive(activatedDomElement,replacedDomElement) {
  if ($(activatedDomElement).hasClass('active')) {
    // do nothing
  } else {
    $(activatedDomElement).toggleClass('active');
    $(replacedDomElement).toggleClass('active');
    $(replacedDomElement).hide(1);
    $(activatedDomElement).show(1);
  }
}

/*-----------------------------------------*/
/*-----------------------------------------*/
//               FUNCTIONS                 //
/*-----------------------------------------*/
/*-----------------------------------------*/
function build_sectors_filter(){
  var checkToggle  = $(".filter.sector span");

  checkToggle.on("click.select2",function(){

    if ( checkToggle.hasClass("checked") ){
      checkToggle.html("Select All");
      $("#sector-filter").multiselect("deselectAll",false).multiselect('refresh');
      markers.clearLayers();
      $("#results-summary").html('');
      checkToggle.removeClass("checked");
    } else {
      checkToggle.html("Unselect All");
      $("#sector-filter").multiselect("selectAll",false).multiselect('refresh');
      checkToggle.addClass("checked");
    }
  });

    $.getJSON("/api/sectors")
      .done(function(data){
        var options = "";
        _.each(data,function(item){
          // load into data state
          _state.setFilter('sector',{value:item.id}, true);

          options += "<label><input id='filter-sector-checkbox'type='checkbox' value='"+item.id+"' onchange='_state.setFilter(\"sector\", this);' checked>"+item.sector+"</label><br />"
          checkToggle.html("Unselect All").addClass("checked");
        });

        $(".filter.sector div.filter-sectors-checkboxes").append(options);

        //Overwrites default buttonText so that the number of options selected is displayed
        $('#sector-filter').multiselect({
          buttonText: function(options, select) {
            if(options.length === 0) {
              return 'None selected'}
            else{
              return options.length + ' selected'
            }
          }
        });
      });
}

function build_countries_filter(){
  var checkToggle  = $(".filter.country span");

  checkToggle.on("click.select2",function(){

    if ( checkToggle.hasClass("checked") ){
      checkToggle.html("Select All");
      $("#country-filter").multiselect("deselectAll",false).multiselect('refresh');
      markers.clearLayers();
      $("#results-summary").html('');
      checkToggle.removeClass("checked");
    } else {
      checkToggle.html("Unselect All");
      $("#country-filter").multiselect("selectAll",false).multiselect('refresh');
      checkToggle.addClass("checked");
    }
  });

  $.getJSON("/api/countries")
    .done(function(data){
      var sortedCountries = _.sortBy(data, function(country) { return country.geounit; });
      var groupedCountries = _.groupBy(sortedCountries, function(country) { return country.geounit.charAt(0) });

      _.forIn(groupedCountries, function(value,key) {
        var letterID = '#' + key;
        var letterHTML = '';
        var countriesByLetterHTML = '';
        letterHTML = '<div id="' + key + '"></div>';
        _.forEach(value, function(thisCountry) {
          // load into data state
          _state.setFilter('country',{value:thisCountry.id}, true);
          var thisCountrysHTML = '<div class="country-filter-choice" id="' + thisCountry.geounit + '"><label><input id="filter-country-checkbox" type="checkbox" value="'+thisCountry.id+'" onchange="_state.setFilter(\'country\', this)" checked>'+thisCountry.geounit+'</label><br /></div>';
          countriesByLetterHTML += thisCountrysHTML;
        })
        $( letterHTML ).appendTo( ".filter-country-checkboxes" );
        $( countriesByLetterHTML ).appendTo( letterID );
      });
    });
}

function build_regions_filter(){
  var checkToggle  = $(".filter.region span");

  checkToggle.on("click.select2",function(){

    if ( checkToggle.hasClass("checked") ){
      checkToggle.html("Select All");
      $("#region-filter").multiselect("deselectAll",false).multiselect('refresh');
      markers.clearLayers();
      $("#results-summary").html('');
      checkToggle.removeClass("checked");
    } else {
      checkToggle.html("Unselect All");
      $("#region-filter").multiselect("selectAll",false).multiselect('refresh');
      checkToggle.addClass("checked");
    }
  });

    $.getJSON("/api/regions")
      .done(function(data){
        var regionsHTML = '';
        _.each(data,function(item){
          _state.setFilter('region',{value:item.region}, true);
          var regionChoice = '<div class="country-filter-choice" id="' + item.region + '"><label><input id="filter-country-checkbox" type="checkbox" value="'+item.region+'" onchange="_state.setFilter(\'region\', this)" checked>'+item.region+'</label><br /></div>';
          regionsHTML += regionChoice;
        });

        $( regionsHTML ).appendTo( ".filter-region-checkboxes" );
      });
}

function draw_map(){
  toggleFilterBlocker();
  update_map(true);
}

function loadInitialData() {
  $.get("api/leads")
    .done(function(data) {
      _state.set(data, true);
    });
}


/**
 *
 * LEAD HELPER FUNCTIONS
 **/

 // TODO: FINISH
function createSingleObjArray(lead) {

   var leadArray = [];

   leadArray.push(lead.opp_unit)
   leadArray.push(lead.project_title);
   leadArray.push(lead.project_description);
   leadArray.push(lead.total_amount);
   leadArray.push(lead.appropriation_year);
   leadArray.push(lead.obligation_year);
   leadArray.push(lead.fund_source)

   // INCONSISTENCY HERE
   leadArray.push(lead.sectors_names.toString());
   leadArray.push(lead.countries_names.toString().replace('\,',' & '));
   leadArray.push(lead.fid);

   leadArray.push(lead.implementing_partner);
   leadArray.push(lead.award_number);
   leadArray.push(lead.fund_mechanism);
   leadArray.push(lead.perform_start_date);
   leadArray.push(lead.perform_end_date);

/**
   leadArray.push(lead.project_announced);
   leadArray.push(lead.project_funding_source);
   leadArray.push(lead.status);
   leadArray.push(lead.project_description);
   leadArray.push(lead.submitting_officer_contact);
   leadArray.push(lead.business_url);
   leadArray.push(lead.link_to_project);
   leadArray.push(moneyFormat.to(parseInt(lead.project_size.replace (/,/g, "")))); */
   //leadArray.push(nFormatter(parseInt(lead.project_size.replace (/,/g, ""),10), 2));

   return leadArray;
}

map.on('move', function() {
  _state.setFilter('map-bounds', null, false);
});

function extractDataForDatatable(leads) {
   var convertedLeadsArray = [];
   leads.forEach(function(lead){
     convertedLeadsArray.push(createSingleObjArray(lead));
   });
   return convertedLeadsArray;
}

markers.on('click', function (a) {
  var data = createSingleObjArray(a.layer.dataObject);
  poulateDetailedEntryView(data);
});

markers.on('clusterclick', function (a) {
    // a.layer is actually a cluster
    console.log('cluster ' + a.layer.getAllChildMarkers().length);
});

function update_map(data) {
    markers.clearLayers();

    if ( data ) {
      $("#results-summary").html(data.length+" results!");

      for (var i = 0; i < data.length; i++) {
        create_leads_table(data[i],i);
        update_map_markers(data[i]);
      };

      map.addLayer(window.markers);
      $.extend( true, $.fn.dataTable.defaults, {
        "searching": false
      });

      var datatableData = extractDataForDatatable(data);

      //destroying the table if it exists
      if($.fn.DataTable.isDataTable( '#leads-table' )){
        $('#leads-table').DataTable().destroy();
      }

      var SIZE_TABLE_INDEX = 1;

      //recreating the datatable
      var table = $('#leads-table').DataTable({
        data: datatableData === [] ? null : datatableData,
        responsive: true,
        info: false,
        length: false,
        language: {
          infoEmpty: "No entries to show"
        },
        columnDefs: [ {
          targets: SIZE_TABLE_INDEX,
          data: function ( row, type, val, meta ) {
            var size = row[SIZE_TABLE_INDEX];
            var value = parseInt(size) || 0;

            if(type === 'display') {
              value = nFormatter(parseInt(value), 2);
            }

            return value;
          }
        }],
        columns: [
            { title: "Project Title" },
            { title: "Total Amount" },
            { title: "Sector" },
            { title: "Country" },
            { title: "fid", visible: false }
        ]
      });
      $('#leads-table_length').parent().removeClass("col-sm-6").addClass("col-sm-12");
      $('#leads-table_length').append('<button type="button" class="filter-subscribe" data-toggle="modal" data-target="#subscribe-form-modal">Subscribe</button>')

      poulateDetailedEntryView(table.row(0).data());

      //datatable row click listner
      $('#data-table tbody').on('click', 'tr', function () {
          var data = table.row( this ).data();
          poulateDetailedEntryView(data);
          highlightMarkerWithFid(data[4]);
      });
    }
}

function highlightMarkerWithFid(fid) {
  console.log(markers);
}

/**
 * poulateDetailedEntryView
 *
 * Takes in the lead data object to populate the lead detail view on
 * the UI.
 */
function poulateDetailedEntryView(data) {

  if (!data) { return }
  // TODO 07/12: UPDATE THIS WITH NEW FIELDS, THIS IS NOT FINISHED!!
  var INDEX_OF_OPP_UNIT = 0;
  var INDEX_OF_PROJECT_TITLE = 1;
  var INDEX_OF_PROJECT_DESCRIPTION = 2;

  var INDEX_OF_SECTORS = 7;
  var INDEX_OF_COUNTRY = 8;

  /**
  var INDEX_OF_DATE_ADDED = 5;
  var INDEX_OF_PRIMARY_FUNDING_SOURCE = 6;
  var INDEX_OF_STATUS = 7;
  var INDEX_OF_DESCRIPTION = 8;
  var INDEX_OF_LEAD_POINT_OF_CONTACT = 9;
  var INDEX_OF_LINK_TO_PROJECT_EMBASSY = 10;
  var INDEX_OF_LINK_TO_PROJECT_WEBSITE = 11;
  var INDEX_OF_FORMATTED_PROJECT_SIZE = 12; */

  //helper functions for html population
  function getHeaderHtml(data) {
    return $('<h5>', {
      'class':'detailed-lead-title',
      'data-toggle': 'tooltip',
      'data-placement': 'bottom',
      'title': data,
      'text': data
    })[0].outerHTML;
  }

  function createTagHtml(tag, data, className) {
    return $("<" + tag +  ">", {
      'text': data,
      'class': className
    })[0].outerHTML;
  }

  function formatDate(date) {
    if(date) {
      var today = new Date(date);
      var options = { year: 'numeric', month: 'numeric', day: 'numeric' };
      var language = window.navigator.userLanguage || window.navigator.language
        || 'us-en';
      return today.toLocaleString(language, options);
    } else {
      return '';
    }
  }

  if (!data[INDEX_OF_DESCRIPTION]) {
    data[INDEX_OF_DESCRIPTION] = "There is no description for this project.";
  }

  // TODO: ADD ALL NEW FIELDS
  var detailedView = getHeaderHtml(data[INDEX_OF_PROJECT_TITLE]);
  detailedView += "<dl class=\"dl-horizontal\">";
  detailedView += createTagHtml('dt', 'Operating Unit') + createTagHtml('dd', data[INDEX_OF_OPP_UNIT]);                        // TODO: CHANGE TO OPERATING UNIT FROM SQL
  detailedView += createTagHtml('dt', 'Country') + createTagHtml('dd', data[INDEX_OF_COUNTRY]);
  detailedView += createTagHtml('dt', 'Total amount');           // TODO: CHANGE PROJECT SIZE TO TOTAL AMOUNT
  detailedView += createTagHtml('dt', 'Appropriation Fiscal Year');
  detailedView += createTagHtml('dt', 'Obligation Fiscal Year');
  detailedView += createTagHtml('dt', 'Fund Source');
  detailedView += createTagHtml('dt', 'Implementing Partner');
  detailedView += createTagHtml('dt', 'Award Number');
  detailedView += createTagHtml('dt', 'Funding Mechanism');
  detailedView += createTagHtml('dt', 'Performance Start Date');
  detailedView += createTagHtml('dt', 'Performance End Date');
  detailedView += createTagHtml('dt', 'Region') + createTagHtml('dd', data[INDEX_OF_OPP_SECTORS]);
  detailedView += createTagHtml('dt', 'Sub Region');
  detailedView += createTagHtml('dt', 'Other Geographic');
  detailedView += createTagHtml('dt', 'Theme/SPSD');
  detailedView += createTagHtml('dt', 'Point of Contact');
  detailedView += createTagHtml('dt', 'Public Website') + '<dd></dd>'; // TODO: REMOVE THIS
  //detailedView += createTagHtml('dt', '?Date Added') + createTagHtml('dd', formatDate(data[INDEX_OF_DATE_ADDED]));
  //detailedView += createTagHtml('dt', '?Primary Funding Source') + createTagHtml('dd', data[INDEX_OF_PRIMARY_FUNDING_SOURCE]);
  //detailedView += createTagHtml('dt', '?Status') + createTagHtml('dd', data[INDEX_OF_STATUS]);

  detailedView += "</dl>";
  detailedView += "<dl>";
  detailedView += createTagHtml('dt', 'Description') + createTagHtml('i', data[INDEX_OF_PROJECT_DESCRIPTION], 'detailed-lead-description');
  detailedView += "</dl>";
  detailedView += "<div class=\"text-center\">";
  if (data[INDEX_OF_LEAD_POINT_OF_CONTACT]) {
    detailedView += "<a class=\"detailed-lead-icon\" data-placement=\"top\" data-toggle=\"tooltip\" title=\"Email lead point of contact\" href=\"mailto:" +
      data[INDEX_OF_LEAD_POINT_OF_CONTACT] + "\"><i class=\"fa fa-envelope fa-5\" aria-hidden=\"true\"></i></a>";
  }
  if (data[INDEX_OF_LINK_TO_PROJECT_EMBASSY]) {
    detailedView += "<a class=\"detailed-lead-icon\" data-toggle=\"tooltip\" title=\"Link to Project embassy\" href=\"" +
      data[INDEX_OF_LINK_TO_PROJECT_EMBASSY] + "\"><i class=\"fa fa-home fa-5\" aria-hidden=\"true\"></i></a>";
  }
  if (data[INDEX_OF_LINK_TO_PROJECT_WEBSITE]) {
    detailedView += "<a class=\"detailed-lead-icon\" data-toggle=\"tooltip\" title=\"Link to Project website\" href=\"" +
      data[INDEX_OF_LINK_TO_PROJECT_WEBSITE] + "\"><i class=\"fa fa-globe fa-5\" aria-hidden=\"true\"></i></a>";
  }
  detailedView += "<div>";
  $('.section--detailed-lead').html(detailedView);
}

/**
 * nFormatter
 *
 * Source: https://stackoverflow.com/questions/9461621/how-to-format-a-number-
 * as-2-5k-if-a-thousand-or-more-otherwise-900-in-javascrip
 *
 * This method is used to shorten a number by appending a symbol and rounding to
 * the number of digits provided.
 *
 * nFormatter(1230000, 2) -> 1.23M
 **/
function nFormatter(num, digits) {

  var si = [
    { value: 1E18, symbol: "E" },
    { value: 1E15, symbol: "P" },
    { value: 1E12, symbol: "T" },
    { value: 1E9,  symbol: "G" },
    { value: 1E6,  symbol: "M" },
    { value: 1E3,  symbol: "k" }
  ], i;
  for (i = 0; i < si.length; i++) {
    if (num >= si[i].value) {
      return (num / si[i].value).toFixed(digits).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + si[i].symbol;
    }
  }
  return num.toString();
}

/**
 * Creates the basic DOM required for the datatables table to
 * render on the page.
 */
function create_leads_table(data,i){
  if ( i === 0 ){
    $("#data-table").html("<table class='table' id='leads-table'><thead></thead><tbody></tbody></table>");
  }
}

function update_map_markers(leadObj){

  _.forEach(leadObj.locations.data, function(location,i) {
        var marker = L.marker(L.latLng(location.lat, location.lng));

        marker.bindPopup("<b>"+leadObj.project_title+"</b><br/>"+leadObj.country+"<br/>"+ nFormatter(parseInt(leadObj.project_size.replace (/,/g, ""),10),2));
        marker.lat = location.lat;
        marker.lng = location.lng;
        marker.dataObject = leadObj;

        window.markers.addLayer(marker);
  }, this);
}

/**
 * DataState Class
 *
 * holds all data for map and chart
 */
function DataState() {
  this.data = []; // populates on intial data grab
  this.listeners = []; // populates explicity
  this.initialCountries = [] // populates on country get
  this.initialSectors = [] // populates on sector get
  this.initialRegions = [] // populates on region get
  this.filterCountries = []; // populates/changes on filter && intial load
  this.filterRegions = []; // populates/changes on filter && intial load
  this.filterSectors = []; // populates/changes on filter && intial load
  this.filterLeadsByBounds = []; // populates/changes on filter && intial load
  this.filterTerms = []; // populates with strings user types in
  this.filterSizeMin = 0; // changes on filter
  this.filterSizeMax = 100000000; // changes on filter
}

/**
 * Reduces the data state based on filters
 * Listeners will fire after state changes
 */
DataState.prototype.set = function (newData, original) {
  if (original) {
    this.data = newData;
  }

  // call all functions that need to update based on data
  this.listeners.forEach(function(func) {
    func(newData);
  });
}

/**
 * Can be used at any time to grab state object
 */
DataState.prototype.get = function () {
  return this.data;
}

/**
 * Changes the data state object based on filter selections/options
 *
 */
DataState.prototype.filter = function () {
  var newData;

  function applyFilter(element) {
    var inRegions = true;
    var inCountries = true;
    var inSectors = true;
    var inSize = true;
    var inTerms = true;
    var isInMapBounds = true;

    // countries selected
    inCountries = _.intersection( this.filterCountries, element.countries_list).length > 0;

    // sectors selected
    inSectors = _.intersection( this.filterSectors, element.sectors_list).length > 0;

     // countries selected
    inRegions = _.intersection( this.filterRegions, element.dos_regions).length > 0;

    // size
    inSize = parseInt(element.project_size.replace (/,/g, ""),10) >= this.filterSizeMin && parseInt(element.project_size.replace (/,/g, ""),10) <= this.filterSizeMax;

    function isLeadInMapBounds(element) {
      var inBounds = false;
      // Get the map bounds - the top-left and bottom-right locations.
      var bounds = map.getBounds();
      _.forEach(element.locations.data,function(loc) {
        inBounds = bounds.contains(L.latLng(loc.lat, loc.lng));
      })
      return inBounds;
    }

    isInMapBounds = isLeadInMapBounds(element);

    // terms
    if (this.filterTerms) {
       var splitElement = _.values(element).toString().toLowerCase().split(" ");
       inTerms = (new RegExp(this.filterTerms.join("|")).test(splitElement));
    }


    return inCountries && inSectors && inSize && inTerms && inRegions && isInMapBounds;
  }

  newData = this.data.filter(applyFilter.bind(this));

  this.set(newData, false);
}

/**
 * Sets the filter options
 */
DataState.prototype.setFilter = function (type, option, initial) {
  switch(type) {
    case 'country':
      if (option.checked || initial) {
        this.filterCountries.push(parseInt(option.value,10));
        if(!option.checked) {
          this.initialCountries.push(parseInt(option.value,10)); // intial load
        }
      }
      else {
        this.filterCountries = _.remove(this.filterCountries, function(cty) {
           return cty != parseInt(option.value,10);
        });
      }
      break;
    case 'region':
      if (option.checked || initial) {
        this.filterRegions.push(option.value);
        if(!option.checked) {
          this.initialRegions.push(option.value); // intial load
        }
      }
      else {
        this.filterRegions = _.remove(this.filterRegions, function(reg) {
           return reg != option.value;
        });
      }
      break;
    case 'map-bounds':
      break;
    case 'region-all-remove':
    $('.filter-regions.active')
        .find('input[type=checkbox]')
        .prop('checked', false);
      this.filterRegions = [];
      break;
    case 'region-all-select':
      $('.filter-regions.active')
        .find('input[type=checkbox]')
        .prop('checked', true);
      this.filterRegions = this.initialRegions;
      break;
    case 'country-all-remove':
    $('.filter-countries.active')
        .find('input[type=checkbox]')
        .prop('checked', false);
      this.filterCountries = [];
      break;
    case 'country-all-select':
      $('.filter-countries.active')
        .find('input[type=checkbox]')
        .prop('checked', true);
      this.filterCountries = this.initialCountries;
      break;
    case 'sector':
      if (option.checked || initial) {
        this.filterSectors.push(parseInt(option.value,10));
        if(!option.checked) {
          this.initialSectors.push(parseInt(option.value,10)); // intial load
        }
      }
      else {
        this.filterSectors = _.remove(this.filterSectors, function(sec) {
           return sec != parseInt(option.value,10);
        });
      }
      break;
    case 'sector-all-remove':
    $('.filter.sector')
        .find('input[type=checkbox]')
        .prop('checked', false);
        this.filterSectors = [];
      break;
    case 'sector-all-select':
      $('.filter.sector')
        .find('input[type=checkbox]')
        .prop('checked', true);
        this.filterSectors = this.initialSectors;
      break;
    case 'size-min':
      this.filterSizeMin = option;
      break;
    case 'size-max':
      this.filterSizeMax = option;
      break;
    case 'search-terms':
      this.filterTerms = option;
      break;
    default:
      console.log("filter not applied!");
      break;
  }


  if(!initial) {
    this.filter();
  }
}

/**
 * Use this register any functions that need to fire when data changes
 */
DataState.prototype.registerListener = function (func) {
  this.listeners.push(func)
}

// ****************************************************

// INIT FUNCTIONS
function registerStateListeners() {
  _state.registerListener(update_map);
}

registerStateListeners();
loadInitialData();

$( "#subscribe-form" ).submit(function( event ) {
  event.preventDefault();

  var title = $('input[name=sub-title]').val();
  var email = $('input[name=sub-email]').val();
  var whento = $('select[name=sub-when]').val();
  var submitObject = {
    "title":       title,
    "email":       email,
    "whento":      whento,
    "countries":   _state.filterCountries,
    "regions":     _state.filterRegions,
    "sectors":     _state.filterSectors,
    "searchTerms": _state.filterTerms,
    "min-size":    _state.filterSizeMin,
    "max-size":    _state.filterSizeMax
  }
  $.post( "/api/subscriptions", submitObject,
   function(success){
     var message;
     if(success) {
        var message = {text:"Success!", classname:"text-success"};
      } else {
        var message = {text:"Could not subscribe - server error!", classname:"text-error"};
      }
      $('#subscribe-form').slideToggle(400, function(){
        $('.subscribe-message').addClass( message.classname );
        $('.subscribe-message').append( message.text );
     });

    })

    .fail(function() {
      $('#subscribe-form').slideToggle();
      alert( "error - please notify us!" );
    });

});
