soysauce.autofillZip = (function() {
	var BASE_URL = "//www.mapquestapi.com/geocoding/v1/address?key=";
	var API_KEY = "Fmjtd%7Cluub2l6tnu%2Ca5%3Do5-96tw0f";
	
	function autofillZip(selector) {
		var self = this;
		
		this.widget = $(selector);
		this.id = parseInt($(selector).attr("data-ss-id"));
		this.zip = this.widget.find("[data-ss-component='zip']");
		this.city = this.widget.find("[data-ss-component='city']");
		this.state = this.widget.find("[data-ss-component='state']");
		this.lastRequestedData;
		
		this.zip.on("keyup change", function(e) {
			self.getLocationData(e);
		});
	}
	
	autofillZip.prototype.setLocationData = function(data) {
		var self = this;
		
		this.lastRequestedData = data;
		if (data.info.statuscode === 0) {
			$.each(data.results[0].locations, function(i, locationData) {
				var city = locationData.adminArea5;
				var state = locationData.adminArea3;
				
				self.city.val(city);
				self.state.val(state);
			});
		}
		else {
			console.warn("Soysauce: Geocoder returned error code " + data.info.statuscode);
		}
	};
	
	autofillZip.prototype.getLocationData = function() {
		var self = this;
		var value = this.zip[0].value;
		
		if ((value.length === 5) && (parseFloat(value) == parseInt(value)) && !isNaN(value))  {
			$("body").append("<script src='" + BASE_URL + API_KEY + "&location=" + value + "&callback=soysauce.fetch(" + this.id + ").setLocationData" + "'></script>");
		}
	};
	
	autofillZip.prototype.handleResize = function() {
		// Placeholder - required soysauce function
	};
	
	return {
		init: function(selector) {
			return new autofillZip(selector);
		}
	};
	
})();
