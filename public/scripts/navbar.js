 $(document).ready(function () {


 		$("li").removeClass("active");

        var url = window.location.pathname;

        if(url=='/')
        	url='/map';

        if(url=='/map'||url=='/')
        {
        	$('#opener').show();
        }
        else{
        	$('#opener').hide();
        }
        $('ul.nav a[href="'+ url +'"]').parent().addClass('active');
        $('ul.nav a').filter(function() {
             return this.href == url;
        }).parent().addClass('active');

        $("#usgform").hide();
        $("#privateform").hide();

        $('input[type=radio][name=usertype]').change(function() {
            if (this.value == 'private') {
                $("#usgform").hide();
                $("#privateform").show();
            }
            else if (this.value == 'usg') {
                $("#privateform").hide();
                $("#usgform").show();
            }
        });


});
