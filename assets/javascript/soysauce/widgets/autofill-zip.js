soysauce.autofillZip = (function() {
	var BASE_URL = "//jeocoder.herokuapp.com/zips/";
	var AOL_URL = "//www.mapquestapi.com/geocoding/v1/reverse?key=Fmjtd%7Cluub2l6tnu%2Ca5%3Do5-96tw0f";
	
	function autofillZip(selector) {
		var options = soysauce.getOptions(selector);
		var self = this;
		
		this.type = "Autofill-Zip";
		this.widget = $(selector);
		this.id = parseInt($(selector).attr("data-ss-id"));
		this.zip = this.widget.find("[data-ss-component='zip']");
		this.city = this.widget.find("[data-ss-component='city']");
		this.state = this.widget.find("[data-ss-component='state']");
		this.lastRequestedData;
		this.freeze = false;
		
		// Reverse Geocode Variables
		this.reverse = false;
		this.reverseGeocodeButton = this.widget.find("[data-ss-component='reverse-geocode']");
		
		if (options) options.forEach(function(option) {
			switch(option) {
				case "reverse":
					self.reverse = true;
					break;
			}
		});
		
		if (this.reverse) {
			this.reverseGeocodeButton.on("click", function() {
				self.reverseGeocode();
			});
		}
		else {
			this.zip.on("keyup change", function() {
				self.getLocationData();
			});
		}
	}
	
	autofillZip.prototype.reverseGeocode = function() {
		var self = this;
		if (!navigator.geolocation || this.freeze) return;
		
		self.widget.trigger("SSDataFetch");
		
		navigator.geolocation.getCurrentPosition(function(data) {
			var src = AOL_URL + "&lat=" + data.coords.latitude + "&lng=" + data.coords.longitude + "&callback=soysauce.fetch(" + self.id + ").setLocationData";
			$("body").append("<script src='" + src + "'></script>");
		});
	};
	
	autofillZip.prototype.setLocationData = function(data) {
		var self = this;
		var city = data.city;
		var state = data.state;
		
		if (this.freeze) return;
		
		this.lastRequestedData = data;
		this.widget.trigger("SSDataReady");

		if (this.reverse) {
			this.zip.val(data.results[0].locations[0].postalCode);
		}
		else {
			this.city.val(city);
			this.state.val(state);
		}
	};
	
	autofillZip.prototype.getLocationData = function() {
		var self = this;
		var value = this.zip[0].value;
		
		if (this.freeze) return;
		
		if ((value.length === 5) && (parseFloat(value) == parseInt(value)) && !isNaN(value))  {
			this.widget.trigger("SSDataFetch");
			$.ajax({
				dataType: "json",
				url: BASE_URL + value,
				success: function(data) {
					self.setLocationData(data);
				},
				error: function() {
					self.widget.trigger("SSDataError");
					console.warn("Soysauce: Could not fetch zip code " + value);
				}
			});
		}
	};
	
	autofillZip.prototype.handleFreeze = function() {
		this.freeze = true;
	};
	
	autofillZip.prototype.handleUnfreeze = function() {
		this.freeze = false;
	};
	
	return {
		init: function(selector) {
			return new autofillZip(selector);
		}
	};
	
})();
