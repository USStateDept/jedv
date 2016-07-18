$(document).ready(function() {
  $('#locationInfoFieldset').hide();
  $('#contactInfoFieldset').hide();
  
  var token = document.cookie.match(/^(.*;)?BIDS_ENTRY_CONTROL_TOKEN=[^;]+(.*)?$/);
  // TODO: comment back
  if (!token || token == null || token == -1) {
    var formAccess = document.getElementById("form-access");
     formAccess.innerHTML = "<h3 class='text-center' style='margin-top:200px'>please create an account or logon from ON</h3>";
  }
});

$("#leadform").submit(function(e) {
  e.preventDefault();
  
    var url = "/leadform";
    var formBody = document.getElementById("form-body");
    var formData = new FormData(this);
     
     $.ajax({
      url: url,
      data: formData,
      processData: false,
      contentType: false,
      type: 'POST'
    })
      .done(function(res) {
        if(res.completed) {
          formBody.innerHTML = "<b style='color:green'>Add Lead  Success!</b>";
        } else {
          formBody.innerHTML = "<b style='color:red'>Add Lead FAILED! - Please contact us</b>";
        }
      })
      .fail(function(err) {
        console.log(err)
         alert('server error, upload failed')
      })
});

$("#next1").click(function() {

  var selectedSectors = []
  var selectedSectorsNames = "";

  for (var i = 0; i < sector_add.options.length; i++) {
    if (sector_add.options[i].selected) {
      selectedSectors.push(sector_add.options[i].value);
      selectedSectorsNames += sector_add.options[i].text + " | ";
    }
  }

  var current = $('li.pb-active').index();
  var isTitleValid = $("#proj_title").valid();
  var isNumberValid = $("#proj_number").valid();
  var isSectorValid = selectedSectors.length > 0;

  if (isSectorValid && isTitleValid && isNumberValid) {
    $('li.pb-active').next().removeClass('inactive').addClass('pb-active');
    $(this).parent().hide();
    $(this).parent().next().show();
  }

  $("#sector").val(selectedSectorsNames);
});

$("#next2").click(function() {

  var current = $('li.pb-active').index();
  var isGeoValid = $("#proj_user_location").valid();

  if (isGeoValid) {
    $('li.pb-active').next().removeClass('inactive').addClass('pb-active');
    $(this).parent().hide();
    $(this).parent().next().show();
  }
});

$(".previous").click(function() {

  var current = $('li.pb-active').index();
  $(this).parent().hide();
  $(this).parent().prev().show();
});

function sectors() {

  $.getJSON("/api/sectors")
    .done(function(data) {
      var options = "";
      _.each(data, function(item) {
        options += "<option value='" + item.id + "'>" + item.sector + " </option>";
      });

      $("#sector_add").append(options);
      $('#sector_add').multiselect();
    });
}

function one_year_from_today() {
  //the days and months must be zero padded to be used as values in a input date type
  var future = new Date(new Date().setYear(new Date().getFullYear() + 1));
  var month = future.getMonth() + 1;
  var day = future.getDate();
  month = (month < 10) ? "0" + month : month;
  day = (day < 10) ? "0" + day : day;

  var text = future.getFullYear() + "-" + month + "-" + day;
  $("#auto_archive_date").val(text);
}

function today() {
  var today = new Date(new Date().setYear(new Date().getFullYear()));
  var month = today.getMonth();
  var day = today.getDate();
  month = (month < 10) ? "0" + month : month;
  day = (day < 10) ? "0" + day : day;

  var text = today.getFullYear() + "-" + month + "-" + day;
  $("#expected_tender_date").val(text);
  $("#proj_announced").val(text);
}

$("#leadform").validate();
one_year_from_today();
today();
sectors();
