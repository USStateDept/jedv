$(document).ready(function() {

  $(document).ready(function() {
      $('.nav-tabs a[href="#edit-leads"]').parents('li').addClass('active');
  });
  /*
  Terry 160411 - Not sure why this^ jquery needs to be wrapped in another
  document.ready but it will not add the class on load if not wrapped ¯\_(ツ)_/¯
  */

  $('#editLeadModal').on('hidden.bs.modal', function () {
      $('.editLeadForm').empty();
  });

  /*
   * This handles the feedback table listing in the feedback tab. Implemented
   * using datatables.
   */
  $('#feedback-table').DataTable({
      dom: 'Bflrtip',
      responsive: true,
      "ajax": {
          "url": '/api/feedback_results',
          "dataSrc": function (json) {
            if(!json){
              json = [];
            }
            return json;
          }
      },
      "columns": [
        { "data": 'id', "title": "ID" },
        { "data": 'answers.0.question.feedback.feedback_type', "title": "Type" },
        { "data": 'created_at', "title": "Submitted On",
          "render": function (data) {
            return formatDate(data) + " " + new Date(data).toTimeString().match( /^([0-9]{2}:[0-9]{2})/ )[0];
          }
        }
      ],
      "drawCallback": function() {
        $('#feedback-table tbody tr').click(function(){
          var thisRow = this;
          var data = $('#feedback-table').dataTable().fnGetData(thisRow);
          $('#showFeedback').modal('show');

          /**
           * genereateFeedbackHTML
           *
           * Generates feedback html using feedback data, which includes answers
           * to populate the modal when a datatable column is clicked.
           */
          function genereateFeedbackHTML(data) {
            if(data) {
              var genereatedFeedbackHTML = "\
                Feedback Type: <span>" + data.answers[0].question.feedback.feedback_type +"</span></br>\
                Id: <span>" + data.id +"</span></br></br>\
              ";
              genereatedFeedbackHTML += "<hr><h4 class=\"feedback-answers-header\">Answers</h4><hr>";
              data.answers.forEach(function(value) {
                genereatedFeedbackHTML += "<p class=\"feedback-question-text\">" + value.question.question_text + "</p>";
                genereatedFeedbackHTML += "<p>" + value.answer_text + "</p></br>";
              });
              return genereatedFeedbackHTML;
            } else {
              return "No data found";
            }
          }

          $(".modal-body #feedback-content").html(genereateFeedbackHTML(data));
        });
      }
  });



  $('#leads-actions-2').DataTable({
    dom: 'Bflrtip',
    responsive: true,
    buttons: [
        'copy', 'csv', 'excel', 'pdf', 'print'
    ],
    "ajax": {
        "url": "/profile/leads",
        "type": "GET"
      },
    "columns": [
        { "data": "fid" },
        { "data": "cleared" },
        { "data": "archived" },
        { "data": "project_title" },
        { "data": "countries_names" },
        { "data": "project_size" },
        { "data": "sectors_names" },
        { "data": "implementing_entity" },
        { "data": "source" }
    ],
    "columnDefs": [
        {
            "targets": [ 0 ],
            "visible": false,
            "searchable": true
        },
        {
            "targets": [ 1 ],
            "visible": false,
            "searchable": true
        },
        {
            "targets": [ 2 ],
            "visible": false,
            "searchable": true
        }
      ],
    "drawCallback": function() {

      $('#leads-actions-2 tbody tr').unbind('click');

      $('#leads-actions-2 tbody tr').click(function(){

        /*
        Get the data from this row in the data table
        */
        var thisRow = this;
        var _data = $('#leads-actions-2').dataTable().fnGetData(thisRow);

        /*
        Transform the row data as needed to properly populate form inputs
        */


        _data.project_announced = formatDate(_data.project_announced);
        _data.tender_date = formatDate(_data.tender_date);
        _data.auto_archive_date = formatDate(_data.auto_archive_date);
        /*
        End transforms
        */

        /*
        When a row is clicked and the modal loads dynamically
        create the edit leads form prepopulated with the
        appropriate values for that row
        */
        $('#editLeadModal').modal('show');

        $('.editLeadForm').append('' +
          '<form role="form" method="post" action="/profile/leads" id="leadform"> ' +
            '<div class="form-group" style="display: none;">' +
              '<label for="fid">*FID</label>' +
              '<input class="form-control" id="fid" name="fid"' +
              'value="' + (_data.fid ? _data.fid : '')  + '">' +
            '</div>' +

            '<div class="checkbox">' +
              '<label><input type="checkbox" id="archived" name="archived"' +
              (_data.archived ? 'checked' : '') + '>Archived' +
            '</label></div>' +

            '<div class="form-group">' +
              '<label for="proj_title">*Project Title:</label>' +
              '<input class="form-control" id="proj_title" name="proj_title"' +
              'value="' + (_data.project_title ? _data.project_title : '') + '"' +
              'required minlength="10">' +
            '</div>' +

            '<div class="form-group">' +
             '<label for="proj_number">*Project Number:</label>' +
              '<input class="form-control" id="proj_number" name="proj_number"' +
              'value="' + (_data.project_number ? _data.project_number : '') + '"' +
              'required>' +
            '</div>' +

            '<div class="form-group">' +
              '<label for = "est_proj_value">Estimated Project Value:</label>' +
              '<input class="form-control" id="est_proj_value" name="est_proj_value"' +
              'value="' + (_data.project_size ? _data.project_size : 0) + '">' +
            '</div>' +

            '<div class="form-group">' +
              '<label for="proj_desc">Project Description:</label>' +
              '<textarea class="form-control" id="proj_desc"' +
              'name="proj_desc">' + (_data.project_description ? _data.project_description : '')+ '</textarea>' +
            '</div>' +

            '<div class="form-group">' +
              '<label for="keywords">Keywords:</label>' +
              '<input class="form-control" id="keywords" name="keywords"' +
              'value="' + (_data.keyword ? _data.keyword : '') + '">' +
            '</div>' +

            '<div class = "form-group">' +
              '<label for="proj_website">*Project Website:</label>' +
              '<input class="form-control" id="proj_website" name="proj_website"' +
              'value="' + (_data.link_to_project ? _data.link_to_project : '') + '"' +
              'required>' +
            '</div>' +

            '<div class ="form-group">' +
              '<label for="proj_announced">Project Announced (date):</label>' +
              '<input type = "date" class="form-control" id="proj_announced" name="proj_announced"' +
              'value="' + (_data.project_announced ? _data.project_announced : '') + '">' +
            '</div>' +

            '<div class="form-group">' +
              '<label for="expected_tender_date">Expected Tender Date:</label>' +
              '<input type="date" class="form-control" id="expected_tender_date" name="expected_tender_date"' +
              'value="' + (_data.tender_date ? _data.tender_date : '')+ '">' +
            '</div>' +

            '<div class="form-group">' +
              '<label for="auto_archive_date">Auto Archive date:</label>' +
              '<input type="date" class="form-control" id="auto_archive_date" name="auto_archive_date"' +
              'value="' + (_data.auto_archive_date ? _data.auto_archive_date : '') + '">' +
            '</div>' +

            '<p>*denotes required fields</p>' +

            '<div class="form-group">' +
              '<label for="imp_entity">*Implementing Entity:</label>' +
              '<input class="form-control" id="imp_entity" name="imp_entity"' +
              'value="' + (_data.implementing_entity ? _data.implementing_entity : '')+ '"' +
              'required>' +
            '</div>' +

            '<div class="form-group">' +
              '<label for="post_comments">Post comments:</label>' +
              '<input class="form-control" id="post_comments" name="post_comments"' +
              'value="' + (_data.post_comments ? _data.post_comments : '') + '">' +
            '</div>' +

            '<button type="submit" class="btn btn-primary">Update Lead</button>' +
            '<button type="button" class="btn btn-default" onclick="$(\'#editLeadModal\').modal(\'hide\')">Close</button>' +

          '</form>');

      });
    }
  });

  var formatDate = function(dateString) {

    if (dateString) {

      var thisDateObj = new Date(dateString);

      var dd = thisDateObj.getDate();
      var mm = thisDateObj.getMonth()+1;
      var yyyy = thisDateObj.getFullYear();

      if ( dd < 10 ) dd = '0' + dd;
      if ( mm < 10 ) mm = '0' + mm;
      if ( yyyy < 10 ) yyyy = '0' + yyyy;

      return yyyy+'-'+mm+'-'+dd;

    } else {
      return dateString;
    }

  };

var editLeadsTable = $('#leads-actions-2').DataTable();

  /* Custom filtering function which will search data in column four between two values */
  $.fn.dataTable.ext.search.push(
    function( settings, data, dataIndex ) {

      var cleared = data[1];
      var archived = data[2];

      var clearedOptionValue = $('#cleared option:selected').val();
      var archivedOptionValue = $('#archived option:selected').val();

      /**
       * optionToBooleanString
       *
       * Coverts option to a boolean value string.
       */
      function optionToBooleanString(option) {
        if( option === 'Yes' || option === 'All') {
          return 'true';
        } else {
          return 'false';
        }
      }

      /**
       * checkIfOptionMatches
       *
       * Checks to see if the option and the value matches.
       * Also returns true if the option provided is 'All'
       */
      function checkIfOptionMatches(value, option) {
        if ((value === optionToBooleanString(option))
          || option === 'All') {
          return true;
        } else {
          return false;
        }
      }

      var showRowBasedOnCleared = checkIfOptionMatches
        (cleared, clearedOptionValue);
      var showRowBasedOnArchived = checkIfOptionMatches
        (archived, archivedOptionValue);

      return showRowBasedOnCleared && showRowBasedOnArchived;
  });

  //Assigns an event listener to redraw the table every time the filters change
  $('.editLeadFormFilters').find('select').on('change', function() {
    editLeadsTable.draw();
  });

  $('#bulk-upload-button').click(function (e) {
    e.preventDefault();

    var formData = new FormData($('#bulk-upload-form')[0]);

    var url = '/profile/bulkUpload2'

    var oOutput  = document.getElementById("bulk-message");

     $.ajax({
      url: url,
      data: formData,
      type: 'POST',
      processData: false,
      contentType: false,
    })
      .done(function(data) {
        if(data.completed) {
          oOutput.innerHTML = "<b style='color:green'>Upload Success!</b>";
        } else {
           oOutput.innerHTML = "<b style='color:red'>"+data.reasons.toString()+"</b>";
        }
      })
      .fail(function(err) {
        console.log(err)
         alert('server error, upload failed')
      })

  });


});
