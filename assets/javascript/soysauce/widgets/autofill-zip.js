soysauce.autofillZip = (function() {
	
	function autofillZip(selector) {
		this.widget = $(selector);
		this.id = parseInt($(selector).attr("data-ss-id"));
		this.zip = this.widget.find("> [data-ss-component='zip']");
		this.city = this.widget.find("> [data-ss-component='city']");
		this.state = this.widget.find("> [data-ss-component='state']");
		
		this.zip.on("keyup change", this.retrieveData);
	}
	
	autofillZip.prototype.retrieveData = function(e) {
		var value = e.target.value;
		console.log("here");
		console.log(google);
		if (!google) return;

		if ((value.length === 5) && (parseFloat(value) == parseInt(value)) && !isNaN(value))  {
			console.log(value);

		}
	};
	
	return {
		init: function(selector) {
			return new autofillZip(selector);
		}
	};
	
})();
// 
// function is_int(value){ 
//   if((parseFloat(value) == parseInt(value)) && !isNaN(value)){
//     return true;
//   } else { 
//     return false;
//   } 
// }
// 
// // Set up
// var firstReveal = true;
// var skip = false;
// 
// // Check if URL is working
// $.ajax({
//   url: "http://zip.elevenbasetwo.com",
//   cache: false,
//   dataType: "json",
//   type: "GET",
// 	data: "zip=15203",
//   success: function(result, success) {
// 		$(".m_autofill").hide();
//   },
// 	error: function(result, success) {
// 		skip = true;
// 	}
// });
// 
// if (skip) return;
// 
// $("#zipCode"). on("keyup change", function() {
// 
// 	// Cache 
// 	var el = $(this);
// 
// 	// Did they type five integers?
// 	if ((el.val().length == 5) && (is_int(el.val())))  {
// 
// 		// Call Ziptastic for information
// 		$.ajax({
// 			url: "http://zip.elevenbasetwo.com",
// 			cache: false,
// 			dataType: "json",
// 			type: "GET",
// 			data: "zip=" + el.val(),
// 			success: function(result, success) {
// 				setTimeout(function() {
// 					
// 					// Odd Cases
// 					if (result.city === "PITT") {
// 						result.city = "PITTSBURGH";
// 					}
// 					else if (result.city === "OKC") {
// 						result.city = "Oklahoma City";
// 					}
// 					
// 					$("#checkoutCity").attr("value", result.city);
// 					$("#stateOrProvince").attr("value", result.state);
// 					checkState($("#stateOrProvince")[0]);
// 					
// 					$("#city_state_zip").removeClass("field_error");
// 				},0);
// 
// 				if (firstReveal) {
// 					$(".m_autofill").show();
// 				}
// 				firstReveal = false;		
// 			},
// 			error: function() {
// 				// Cannot find zip code
// 				$(".m_autofill").show();
// 			}
// 		});
// 	}
// });