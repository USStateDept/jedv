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
// TODO: FINISH
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
  // more accessible variables can go here, even the whole object
}

SummaryModal.prototype.buildSummary = function(){
  // decide whether or not to create a web link
  var webLink = (this.website != undefined ? "<a href='"+this.website+"' target='_blank'>website</a>" : "<p>no website</p>")
  // decide whether or not to create a contact link
  var contactLink = (this.contact != undefined ? "<a href='mailto:"+this.contact+"'>contact</a>" : "<p>no contact</p>")
  // summary modal
  //TODO: update to new fields
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
      // TODO: IMPLEMENT WITH TOTAL_AMOUNT //spanElement.append( $('<p>').text(nFormatter(parseInt(sortedRanks[i].project_size.replace (/,/g, ""),10), 2)));
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


// TODO: REMOVE SECTORS
/* DEPRECATED */
// build_sectors_filter();
/*            */


build_operating_unit_filter();
build_countries_filter();
build_regions_filter();
build_sub_regions_filter();
build_obligation_year_filter()
build_fund_source_filter();

// add back in
/*build_sub_region_filter();
*/



//set the left margin on the second tooltip

$('[data-toggle="tooltip"]').tooltip();
$("#search-input").select2({
  tags: true,
  tokenSeparators: [','],
  placeholder: "Search for a project..."
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

function build_operating_unit_filter(){
  var checkToggle  = $(".filter.operating_unit span");

  checkToggle.on("click.select2",function(){

    if ( checkToggle.hasClass("checked") ){
      checkToggle.html("Select All");
      $("#operating_unit-filter").multiselect("deselectAll",false).multiselect('refresh');
      markers.clearLayers();
      $("#results-summary").html('');
      checkToggle.removeClass("checked");
    } else {
      checkToggle.html("Unselect All");
      $("#operating_unit-filter").multiselect("selectAll",false).multiselect('refresh');
      checkToggle.addClass("checked");
    }
  });

    $.getJSON("/api/leads/opp_unit")
      .done(function(data){
        var oppUnitHTML = '';
        _.each(data,function(item){
          _state.setFilter('operating_unit',{value:item}, true);
          var oppUnitChoice = '<div class="operating_unit-filter-choice" id="' + item + '"><label><input id="filter-operating_unit-checkbox" type="checkbox" value="'+item+'" onchange="_state.setFilter(\'operating_unit\', this)" checked>'+item+'</label><br /></div>';
          oppUnitHTML += oppUnitChoice;
        });

//        console.log(oppUnitHTML);
        $( oppUnitHTML ).appendTo( ".filter-operating_unit-checkboxes" );
      });
}

function build_sub_regions_filter(){
  var checkToggle  = $(".filter.sub_region span");

  checkToggle.on("click.select2",function(){

    if ( checkToggle.hasClass("checked") ){
      checkToggle.html("Select All");
      $("#sub_region-filter").multiselect("deselectAll",false).multiselect('refresh');
      markers.clearLayers();
      $("#results-summary").html('');
      checkToggle.removeClass("checked");
    } else {
      checkToggle.html("Unselect All");
      $("#sub_region-filter").multiselect("selectAll",false).multiselect('refresh');
      checkToggle.addClass("checked");
    }
  });

    $.getJSON("/api/leads/sub_region")
      .done(function(data){
        var subRegHTML = '';
        _.each(data,function(item){
          _state.setFilter('sub_region',{value:item}, true);
          var subRegChoice = '<div class="sub_region-filter-choice" id="' + item + '"><label><input id="filter-sub_region-checkbox" type="checkbox" value="'+item+'" onchange="_state.setFilter(\'sub_region\', this)" checked>'+item+'</label><br /></div>';
          subRegHTML += subRegChoice;
        });

        $( subRegHTML ).appendTo( ".filter-sub_region-checkboxes" );
      });
}

function build_obligation_year_filter(){
  var checkToggle  = $(".filter.obligation_year span");

  checkToggle.on("click.select2",function(){

    if ( checkToggle.hasClass("checked") ){
      checkToggle.html("Select All");
      $("#obligation_year-filter").multiselect("deselectAll",false).multiselect('refresh');
      markers.clearLayers();
      $("#results-summary").html('');
      checkToggle.removeClass("checked");
    } else {
      checkToggle.html("Unselect All");
      $("#obligation_year-filter").multiselect("selectAll",false).multiselect('refresh');
      checkToggle.addClass("checked");
    }
  });

    $.getJSON("/api/leads/obligation_year")
      .done(function(data){

        

        var obYearHTML = '';
        _.each(data,function(item){
          console.log("=============================================================")
          _state.setFilter('obligation_year',{value:item}, true);
          var obYearChoice = '<div class="obligation_year-filter-choice" id="' + item + '"><label><input id="filter-obligation_year-checkbox" type="checkbox" value="'+item+'" onchange="_state.setFilter(\'obligation_year\', this)" checked>'+item+'</label><br /></div>';
          obYearHTML += obYearChoice;
        });

        $( obYearHTML ).appendTo( ".filter-obligation_year-checkboxes" );
      });
}

function build_fund_source_filter(){
  var checkToggle  = $(".filter.fund_source span");

  checkToggle.on("click.select2",function(){

    if ( checkToggle.hasClass("checked") ){
      checkToggle.html("Select All");
      $("#fund_source-filter").multiselect("deselectAll",false).multiselect('refresh');
      markers.clearLayers();
      $("#results-summary").html('');
      checkToggle.removeClass("checked");
    } else {
      checkToggle.html("Unselect All");
      $("#fund_source-filter").multiselect("selectAll",false).multiselect('refresh');
      checkToggle.addClass("checked");
    }
  });

    $.getJSON("/api/leads/fund_source")
      .done(function(data){
        var fundSourceHTML = '';
        _.each(data,function(item){
          _state.setFilter('fund_source',{value:item}, true);
          var fundSourceChoice = '<div class="fund_source-filter-choice" id="' + item + '"><label><input id="filter-fund_source-checkbox" type="checkbox" value="'+item+'" onchange="_state.setFilter(\'fund_source\', this)" checked>'+item+'</label><br /></div>';
          fundSourceHTML += fundSourceChoice;
        });

        $( fundSourceHTML ).appendTo( ".filter-fund_source-checkboxes" );
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
        //console.log(countriesByLetterHTML);
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

// checks to see that we're not returning something we don't want
function isLeadElementValid(item) {
  return item !== 'fid' && item !== 'cleared' && item !== 'editable' && item !== 'archived' && item !== 'auto_archive_date' && item !== 'the_geom' && item !== 'countries_list';
}

/**
 *
 * LEAD HELPER FUNCTIONS
 **/

 // TODO: 
    // DONE: UPDATE METHOD TO DYNAMICALLY ADD ARRAY MEMBERS
    // OTHER GEOGRAPHIC ISSUE
function createSingleObjArray(lead) {

  var leadArray = [];
  
  Object.keys(lead).forEach(function(key) {

    if (isLeadElementValid(key))
    {
      leadArray.push(lead[key])
      // uncomment below to see whats in our object
      //console.log(key, lead[key]);
    }
  });



/**
   leadArray.push(lead.opp_unit)
   leadArray.push(lead.project_title);
   leadArray.push(lead.project_description);
   leadArray.push(lead.total_amount);
   leadArray.push(lead.appropriation_year);
   leadArray.push(lead.obligation_year);
   leadArray.push(lead.fund_source)
   leadArray.push(lead.implementing_partner);
   leadArray.push(lead.award_number);

   // INCONSISTENCY HERE
   //leadArray.push(lead.sectors_names.toString());
   leadArray.push(lead.countries_names.toString().replace('\,',' & '));
   //leadArray.push(lead.fid);

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

// TODO: REIMPLEMENT
  // THIS CONTROLS THE ELEMENTS IN VIEW WHEN ZOOMING IN/OUT
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
            { title: "Operating Unit" },
            { title: "Project Title" },
            { title: "Description" }, // TODO CHANGE TO TOTAL AMOUNT
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

  var INDEX_OF_OPP_UNIT = 0;
  var INDEX_OF_PROJECT_TITLE = 1;
  var INDEX_OF_PROJECT_DESCRIPTION = 2;
  var INDEX_OF_TOTAL_AMOUNT = 3;
  var INDEX_OF_APPROPRIATION_YEAR = 4;
  var INDEX_OF_OBLIGATION_YEAR = 5;
  var INDEX_OF_FUND_SOURCE = 6;
  var INDEX_OF_IMPLEMENTING_PARTNER = 7;
  var INDEX_OF_AWARD_NUMBER = 8;
  var INDEX_OF_FUND_MECHANISM = 9;
  var INDEX_OF_PERFORM_START_DATE = 10;
  var INDEX_OF_PERFORM_END_DATE = 11;
  var INDEX_OF_COUNTRY = 18;
  var INDEX_OF_REGION = 19;
  var INDEX_OF_SUB_REGION = 13;
  var INDEX_OF_LOCATIONS = 14;
  var INDEX_OF_PROJECT_THEME = 15;
  var INDEX_OF_PROJECT_POCS = 16;
  var INDEX_OF_PUBLIC_WEBSITE = 17;

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

  // TODO: PUT THIS BACK
  // if (!data[INDEX_OF_DESCRIPTION]) {
  //   data[INDEX_OF_DESCRIPTION] = "There is no description for this project.";
  // }

  console.log('hey buddy', data[INDEX_OF_LOCATIONS])

  var detailedView = getHeaderHtml(data[INDEX_OF_PROJECT_TITLE]);
  detailedView += "<dl class=\"dl-horizontal\">";
  detailedView += createTagHtml('dt', 'Operating Unit') + createTagHtml('dd', data[INDEX_OF_OPP_UNIT]);
  detailedView += createTagHtml('dt', 'Country') + createTagHtml('dd', data[INDEX_OF_COUNTRY]);
  detailedView += createTagHtml('dt', 'Total amount') + createTagHtml('dd', data[INDEX_OF_TOTAL_AMOUNT]);
  detailedView += createTagHtml('dt', 'Appropriation Fiscal Year') + createTagHtml('dd', data[INDEX_OF_APPROPRIATION_YEAR]);
  detailedView += createTagHtml('dt', 'Obligation Fiscal Year') + createTagHtml('dd', data[INDEX_OF_OBLIGATION_YEAR]);
  detailedView += createTagHtml('dt', 'Fund Source') + createTagHtml('dd', data[INDEX_OF_FUND_SOURCE]);
  detailedView += createTagHtml('dt', 'Implementing Partner') + createTagHtml('dd', data[INDEX_OF_IMPLEMENTING_PARTNER]);
  detailedView += createTagHtml('dt', 'Award Number') + createTagHtml('dd', data[INDEX_OF_AWARD_NUMBER]);
  detailedView += createTagHtml('dt', 'Funding Mechanism') + createTagHtml('dd', data[INDEX_OF_FUND_MECHANISM]);
  detailedView += createTagHtml('dt', 'Performance Start Date') + createTagHtml('dd', data[INDEX_OF_PERFORM_START_DATE]);
  detailedView += createTagHtml('dt', 'Performance End Date') + createTagHtml('dd', data[INDEX_OF_PERFORM_END_DATE]);
  detailedView += createTagHtml('dt', 'Region') + createTagHtml('dd', data[INDEX_OF_REGION]);
  detailedView += createTagHtml('dt', 'Sub Region') + createTagHtml('dd', data[INDEX_OF_SUB_REGION]);
  detailedView += createTagHtml('dt', 'Other Geographic') + createTagHtml('dd', data[INDEX_OF_LOCATIONS]);
  detailedView += createTagHtml('dt', 'Theme/SPSD') + createTagHtml('dd', data[INDEX_OF_PROJECT_THEME]);
  detailedView += createTagHtml('dt', 'Point of Contact') + createTagHtml('dd', data[INDEX_OF_PROJECT_POCS]);
  detailedView += createTagHtml('dt', 'Public Website') + createTagHtml('dd', data[INDEX_OF_PUBLIC_WEBSITE]);

  detailedView += "</dl>";
  detailedView += "<dl>";
  detailedView += createTagHtml('dt', 'Description') + createTagHtml('i', data[INDEX_OF_PROJECT_DESCRIPTION], 'detailed-lead-description');
  detailedView += "</dl>";
  detailedView += "<div class=\"text-center\">";

// TODO: PUT BACK IN( THESE ARE THE BUTTONS)
//console.log(data[INDEX_OF_COUNTRY]);
  if (data[INDEX_OF_PROJECT_POCS]) {
    detailedView += "<a class=\"detailed-lead-icon\" data-placement=\"top\" data-toggle=\"tooltip\" title=\"Email lead point of contact\" href=\"mailto:" +
      data[INDEX_OF_PROJECT_POCS] + "\"><i class=\"fa fa-envelope fa-5\" aria-hidden=\"true\"></i></a>";
  }
  if (data[INDEX_OF_PUBLIC_WEBSITE]) {
    detailedView += "<a class=\"detailed-lead-icon\" data-toggle=\"tooltip\" title=\"Link to Project website\" href=\"" +
      data[INDEX_OF_PUBLIC_WEBSITE] + "\"><i class=\"fa fa-globe fa-5\" aria-hidden=\"true\"></i></a>";
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

        marker.bindPopup("<b>"+leadObj.opp_unit+"</b><br/>"+leadObj.project_title+"</b><br/>"+leadObj.country+"<br/>"); //TODO: ADD BACK IN: + nFormatter(parseInt(leadObj.total_amount.replace (/,/g, ""),10),2)
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

  /* DEPRECATED */
  this.initialSectors = [] // populates on sector get
  /*            */

  this.initialCountries = [] // populates on country get
  this.initialRegions = [] // populates on region get
  this.initialOpUnit = []
  this.initialSubRegions = []
  this.initialObFiscalYear = []
  this.initialFundSource = []

  this.filterCountries = []; // populates/changes on filter && intial load
  this.filterRegions = []; // populates/changes on filter && intial load
  this.filterOpUnit = [];
  this.filterSubRegions = []
  this.filterObFiscalYear = []
  this.filterFundSource = []

  /* DEPRECATED */
  this.filterSectors = []; // populates/changes on filter && intial load
  /*            */

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
    var inOpUnit = true;
    var inSubRegions = true;
    var inObFiscalYear = true;
    var inFundSource = true;


    /* DEPRECATED */
    var inSectors = true;
    /*            */

    var inSize = true;
    var inTerms = true;
    var isInMapBounds = true;

    // TODO: Put correct fields here

    // countries selected
    
    /* TODO: 
     * For some reason, opp_unit is passed in as a single element rather than an array, so it is concatenated to an array below.
     * This needs to be fixed because it should NOT be passed as a String.
     * For the sake of time though this is what I've done
     */ 
    /*
    console.log('intersection thanggg', _.intersection( this.filterOpUnit, element.opp_unit).length > 0);
    console.log('filterOpUnit', this.filterOpUnit);
    console.log('opp_unit', [element.opp_unit]);
    console.log('HELLO')
    console.log('intersection', _.intersection( this.filterOpUnit, [element.opp_unit]));
*/

    inCountries = _.intersection( this.filterCountries, element.countries_list).length > 0;
    inRegions = _.intersection( this.filterRegions, element.dos_regions).length > 0;
    inOpUnit = _.intersection( this.filterOpUnit, [element.opp_unit]).length > 0;
    inSubRegions = _.intersection( this.filterSubRegions, [element.sub_region]).length > 0;
    inObFiscalYear = _.intersection( this.filterObFiscalYear, [element.obligation_year]).length > 0;
    inFundSource = _.intersection( this.filterFundSource, [element.fund_source]).length > 0;

    /* DEPRECATED */
    // sectors selected
    inSectors = _.intersection( this.filterSectors, element.sectors_list).length > 0;
    /*            */



    // size
    //inSize = parseInt(element.project_size.replace (/,/g, ""),10) >= this.filterSizeMin && parseInt(element.project_size.replace (/,/g, ""),10) <= this.filterSizeMax;

    function isLeadInMapBounds(element) {
      var inBounds = false;
      // Get the map bounds - the top-left and bottom-right locations.
      var bounds = map.getBounds();
      _.forEach(element.locations.data,function(loc) {
        inBounds = bounds.contains(L.latLng(loc.lat, loc.lng));
      })
      // TODO
      //return inBounds;
      return true;
    }

    isInMapBounds = isLeadInMapBounds(element);

    // terms
    if (this.filterTerms) {
       var splitElement = _.values(element).toString().toLowerCase().split(" ");
       inTerms = (new RegExp(this.filterTerms.join("|")).test(splitElement));
    }

    // console.log(inSubRegions) // TODO: guilty until proven innocent (aka not sure if this works yet since no data)
    console.log(inObFiscalYear)


    return inCountries && inSize && inTerms && inRegions && inOpUnit && inSubRegions && inFundSource && inObFiscalYear; //&& isInMapBounds;
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

    case 'operating_unit':
      if (option.checked || initial) {
        this.filterOpUnit.push(option.value);
        if(!option.checked) {
          this.initialOpUnit.push(option.value); // intial load
        }
        //console.log('restored array should be ', this.filterOpUnit)
      }
      else {
        this.filterOpUnit = _.remove(this.filterOpUnit, function(op) {
           return op != option.value;
        });
        //console.log('empty array should be ', this.filterOpUnit)
      }
      break;

    case 'operating_unit-all-remove':
    $('.filter-operating_unit.active')
        .find('input[type=checkbox]')
        .prop('checked', false);
      this.filterOpUnit = [];

      break;

    case 'operating_unit-all-select':
      $('.filter-operating_unit.active')
        .find('input[type=checkbox]')
        .prop('checked', true);
      this.filterOpUnit = this.initialOpUnit;
      //console.log(this.filterOpUnit)
      //console.log(this.initialOpUnit)
      break;

    case 'sub_region':
      if (option.checked || initial) {
        this.filterSubRegions.push(option.value);
        if(!option.checked) {
          this.initialSubRegions.push(option.value); // intial load
        }
      }
      else {
        this.filterSubRegions = _.remove(this.filterSubRegions, function(subreg) {
           return subreg != option.value;
        });
      }
      break;

    case 'sub_region-all-remove':
    $('.filter-sub_region.active')
        .find('input[type=checkbox]')
        .prop('checked', false);
      this.filterSubRegions = [];

      break;

    case 'sub_region-all-select':
      $('.filter-sub_region.active')
        .find('input[type=checkbox]')
        .prop('checked', true);
      this.filterSubRegions = this.initialSubRegions;
      break;

    case 'obligation_year':
      if (option.checked || initial) {
        this.filterObFiscalYear.push(parseInt(option.value,10));
        if(!option.checked) {
          this.initialObFiscalYear.push(option.value); // intial load
        }
      }
      else {
        console.log('or else what? exactly')
        this.filterObFiscalYear = _.remove(this.filterObFiscalYear, function(obFisc) {
          console.log('ob is', obFisc)
           return obFisc != option.value;
        });
        console.log(this.filterObFiscalYear)
      }
      break;

    case 'obligation_year-all-remove':
    $('.filter-obligation_year.active')
        .find('input[type=checkbox]')
        .prop('checked', false);
      this.filterObFiscalYear = [];

      break;

    case 'obligation_year-all-select':
      $('.filter-obligation_year.active')
        .find('input[type=checkbox]')
        .prop('checked', true);
      this.filterObFiscalYear = this.initialObFiscalYear;
      break;

    case 'fund_source':
      if (option.checked || initial) {
        this.filterFundSource.push(option.value);
        if(!option.checked) {
          this.initialFundSource.push(option.value); // intial load
        }
      }
      else {
        this.filterFundSource = _.remove(this.filterFundSource, function(ob) {
           return ob != option.value;
        });
      }
      break;

    case 'fund_source-all-remove':
    $('.filter-fund_source.active')
        .find('input[type=checkbox]')
        .prop('checked', false);
      this.filterFundSource = [];

      break;

    case 'fund_source-all-select':
      $('.filter-fund_source.active')
        .find('input[type=checkbox]')
        .prop('checked', true);
      this.filterFundSource = this.initialFundSource;
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
      console.log(type, option, initial)
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

// TODO: Update with new fields
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
    "operating units": _state.filterOpUnit,
    "regions":     _state.filterRegions,
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
