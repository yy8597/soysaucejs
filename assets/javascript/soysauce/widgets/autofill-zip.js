soysauce.autofillZip = (function() {
	var BASE_URL = "//jeocoder.herokuapp.com/zips/";
	
	function autofillZip(selector) {
		var self = this;
		
		this.widget = $(selector);
		this.id = parseInt($(selector).attr("data-ss-id"));
		this.zip = this.widget.find("[data-ss-component='zip']");
		this.city = this.widget.find("[data-ss-component='city']");
		this.state = this.widget.find("[data-ss-component='state']");
		this.lastRequestedData;
		
		this.zip.on("keyup change", function() {
			self.getLocationData();
		});
	}
	
	autofillZip.prototype.setLocationData = function(data) {
		var self = this;
		var city = data.city;
		var state = data.state;
		
		this.lastRequestedData = data;

		self.city.val(city);
		self.state.val(state);
	};
	
	autofillZip.prototype.getLocationData = function() {
		var self = this;
		var value = this.zip[0].value;
		
		if ((value.length === 5) && (parseFloat(value) == parseInt(value)) && !isNaN(value))  {
			$.ajax({
				dataType: "json",
				url: BASE_URL + value,
				success: function(data) {
					self.setLocationData(data);
				},
				error: function() {
					console.warn("Soysauce: Could not fetch zip code " + value);
				}
			});
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
