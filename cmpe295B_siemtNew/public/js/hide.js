
		
		$(document).ready(function(){
			console.log('hello');
			$("#pdfButton").hide();
			$("#temp").hide();
			 $("#pressure").hide();
			  $("#humidity").hide();

			  $('#drop').on('change', function () {
				  var result = $(this).val();
        			
    if(result === "temp"){
        $("#temp").show();

         $("#pressure").hide();
         $("#humidity").hide();

    } 
    else if(result === "pressure"){
        $("#pressure").show();
      
        $("#temp").hide();
        $("#humidity").hide();

    } 
    
       else {
		 $("#humidity").show(); 

		 $("#temp").hide();
		  $("#pressure").hide();

		 }    
 
});

			
		});

		$( "#getData" ).click(function() {
 		$("#pdfButton").show();
		});

	
	