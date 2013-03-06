soysauce.autofillZip = (function() {
	
	function autofillZip(selector) {
		var self = this;
		
		this.widget = $(selector);
		this.id = parseInt($(selector).attr("data-ss-id"));
		this.zip = this.widget.find("[data-ss-component='zip']");
		this.city = this.widget.find("[data-ss-component='city']");
		this.state = this.widget.find("[data-ss-component='state']");
		
		this.zip.on("keyup change", function(e) {
			self.retrieveData(e);
		});
	}
	
	autofillZip.prototype.retrieveData = function(e) {
		var value,
				self = this;
		
		if (!soysauce.geocoder) return;
		
		if (!e) {
			value = this.zip[0].value;
		}
		else {
			value = e.target.value;
		}

		if ((value.length === 5) && (parseFloat(value) == parseInt(value)) && !isNaN(value))  {
			soysauce.geocoder().geocode({"address": value}, function(results, status) {
				var city, state_long, state_short, state_index;
				
				if (status === "ZERO_RESULTS") return;
				
				city = results[0].address_components[1].long_name;
				state_long = results[0].address_components[3].long_name;
				
				state_index = results[0].address_components.length - 2;
				state_short = results[0].address_components[state_index].short_name;
				
				self.city.val(city);
				self.state.val(state_short);

				if (self.state.val() === "") {
					self.state.val(state_short.toLowerCase());
					if (self.state.val() === "") {
						self.state.val(state_long);
					}
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
