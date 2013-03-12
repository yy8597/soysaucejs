$(document).ready(function() {
	var html = "";
	
	if ($("body").hasClass("carousels")) {
		var img1 = "<img data-ss-component='item' src='http://pipocamoderna.com.br/wp-content/uploads/2012/06/ironman-08preview-lg-600x400.jpg'>";
		var img2 = "<img data-ss-component='item' src='http://wallpapermaning.com/wp-content/uploads/2013/01/Audi-R8-Background-600x400.jpg'>";
		var img3 = "<img data-ss-component='item' src='http://collider.com/wp-content/image-base/Movies/I/Iron_Man_movie/Iron_Man_Movie_/iron_man_movie_image__11_.jpg'>";
		var options = "";
		var params = location.search.match(/\w+=/g);

		if (params) {
			params.forEach(function(element) {
				options += element.replace("=", " ");
			});
		}
		
		html = "<div data-ss-widget='carousel' data-ss-options='" + options + "'>";
		html += img1;
		html += img2;
		html += img3;
		html += "</div>";
		
		$("#carousel").append(html);
		soysauce.init("#carousel [data-ss-widget]");
	}
	else if ($("body").hasClass("zip")) {
		var autofill1 = soysauce.fetch(1);
		var autofill2 = soysauce.fetch(2);
		
		autofill1.widget.on("SSDataFetch", function() {
			showLoader(autofill1);
		});
		
		autofill2.widget.on("SSDataFetch", function() {
			showLoader(autofill2);
		});
		
		autofill1.widget.on("SSDataReady SSDataError", function() {
			hideLoader(autofill1);
		});
		
		autofill2.widget.on("SSDataReady SSDataError", function() {
			hideLoader(autofill2);
		});
		
		function showLoader(widget) {
			widget.zip.find("+ img").show();
		}
		
		function hideLoader(widget) {
			widget.zip.find("+ img").hide();
		}
	}
	else if ($("body").hasClass("autodetect-cc")) {
		var widget = soysauce.fetch("#cc-input");
		var prediction = $("#prediction");
		var result = $("#result");
		var ccInput = $("#cc-input");
		var cardElements = $(".cards li");
		
		ccInput.on("SSDetect1", function() {
			prediction.html(widget.state1);
			
			if (widget.state1 !== undefined) {
				cardElements.each(function(i, card) {
					var cards = widget.state1.split(" ");
					var setInactive = true;

					cards.forEach(function(name) {
						if ($(card).hasClass(name)) {
							setInactive = false;
						}
					});

					if (setInactive) {
						$(card).addClass("inactive");
					}
					else {
						$(card).removeClass("inactive");
					}
				});
			}
		});
		
		ccInput.on("SSDetect2", function() {
			result.html(widget.state2);
			$(".cards li:not(." + widget.state2 + ")").addClass("inactive");
			$(".cards li." + widget.state2).removeClass("inactive");
		});
		
		ccInput.on("keyup change", function() {
			if (ccInput.val() === "") {
				prediction.html("");
				result.html("");
				cardElements.removeClass("inactive");
			}
		});
	}
});