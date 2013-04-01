$(document).ready(function() {
	$(".home").each(function() {
		var autofill = soysauce.fetch("[data-ss-widget='autofill-zip']");
		var loader = $(".ajaxLoader");
		
		autofill.widget.on("SSDataFetch", function() {
			showLoader(autofill);
		});

		autofill.widget.on("SSDataReady SSDataError", function() {
			hideLoader(autofill);
		});
		
		autofill.widget.on("SSDataError", function() {
			autofill.zip.addClass("error");
		});
		
		autofill.widget.on("SSDataReady", function() {
			$(".message").css("opacity", "1");
			autofill.zip.removeClass("error");
		});
		
		$(".proceed button").on("click", function() {
			$(".step1").hide();
			$(".step2").show();
		});
		
		$(".latest input[type=text]").click(function() {
		   $(this).select();
		});
		
		function showLoader(widget) {
			loader.css("visibility", "visible");
		}
		
		function hideLoader(widget) {
			loader.css("visibility", "hidden");
		}
	});
});