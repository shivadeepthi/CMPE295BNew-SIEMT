
		
		$(document).ready(function(){
			console.log('hello');
			$("#pdfButton").hide();
			$("#temp").hide();
			 $("#pressure").hide();
			  $("#humidity").hide();
			  	$("#Accelero").hide();

		

			  $('#drop').on('change', function () {
				  var result = $(this).val();
        			
    if(result === "temp"){
        $("#temp").show();

         $("#pressure").hide();
         $("#humidity").hide();
         			  	$("#Accelero").hide();

    } 
    else if(result === "pressure"){
        $("#pressure").show();
      
        $("#temp").hide();
        $("#humidity").hide();
        			  	$("#Accelero").hide();

    } 
    
       else if(result==="humidity") {
		 $("#humidity").show(); 

		 $("#temp").hide();
		  $("#pressure").hide();
		 	$("#Accelero").hide();


		 }  


		 else  {
		 $("#Accelero").show(); 

		 $("#temp").hide();
		  $("#pressure").hide();
		   $("#humidity").hide();


		 }      
 
});


		});

		$( "#getData" ).click(function() {
 		$("#pdfButton").show();
		});


	
	