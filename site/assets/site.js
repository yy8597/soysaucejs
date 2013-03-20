$(document).ready(function() {
	var html = "";
	
	if ($("body").hasClass("carousels")) {
		var img1 = "<div data-ss-component='item'><img src='http://pipocamoderna.com.br/wp-content/uploads/2012/06/ironman-08preview-lg-600x400.jpg'></div>";
		var img2 = "<div data-ss-component='item'><img src='http://wallpapermaning.com/wp-content/uploads/2013/01/Audi-R8-Background-600x400.jpg'></div>";
		var img3 = "<div data-ss-component='item'><img src='http://collider.com/wp-content/image-base/Movies/I/Iron_Man_movie/Iron_Man_Movie_/iron_man_movie_image__11_.jpg'></div>";
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
		
		ccInput.on("SSPrediction", function() {
			prediction.html(widget.prediction);
			
			if (widget.prediction !== undefined) {
				cardElements.each(function(i, card) {
					var cards = widget.prediction.split(" ");
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
			else {
				prediction.html("unknown type");
				cardElements.addClass("inactive");
			}
		});
		
		ccInput.on("SSResult", function() {
			if (!widget.result) {
				result.html("invalid card");
			}
			else {
				result.html(widget.result);
			}
			$(".cards li:not(." + widget.result + ")").addClass("inactive");
			$(".cards li." + widget.result).removeClass("inactive");
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