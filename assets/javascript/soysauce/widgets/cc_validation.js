soysauce.ccValidators = (function() {
	var validators = new Array();
	
	function ccValidator(input) {
		var self = this;
		
		this.id = parseInt($(input).attr("data-ss-id"));
		this.input = $(input);
		this.state1;
		this.state2;
		
		this.input.on("keyup change", function(e) {
			var card_num = e.target.value.replace(/-/g, "");
			
			// State 1
			if (card_num.length === 1) {
				$(e.target).trigger("state1");
				if (card_num.match(/^4/)) {
					self.state1 = "visa";
				} else if (card_num.match(/^5/)) {
					self.state1 = "mastercard";
				} else if (card_num.match(/^3/)) {
					self.state1 = "amex dinersclub";
				} else if (card_num.match(/^6(?:011|5[0-9]{2})/)) {
					self.state1 = "discover";
				} else if (card_num.match(/^(?:2131|1800|35\d{3})/)) {
					self.state1 = "jcb";
				} else {
					self.state1 = undefined;
				}
			} else if (card_num.length === 0) {
				self.state1 = undefined;
			}

			// State 2
			if (card_num.match(/^4[0-9]{12}(?:[0-9]{3})?$/)) {
				self.state2 = "visa";
				$(e.target).trigger("state2");
			} else if (card_num.match(/^5[1-5][0-9]{14}$/)) {
				self.state2 = "mastercard";
				$(e.target).trigger("state2");
			} else if (card_num.match(/^3[47][0-9]{13}$/)) {
				self.state2 = "amex";
				$(e.target).trigger("state2");
			} else if (card_num.match(/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/)) {
				self.state2 = "dinersclub";
				$(e.target).trigger("state2");
			} else if (card_num.match(/^6(?:011|5[0-9]{2})[0-9]{12}$/)) {
				self.state2 = "discover";
				$(e.target).trigger("state2");
			} else if (card_num.match(/^(?:2131|1800|35\d{3})\d{11}$/)) {
				self.state2 = "jcb";
				$(e.target).trigger("state2");
			} else {
				self.state2 = undefined;
			}
				
		});
	}
	
	// Init
	(function() {
		$("[data-ss-widget='cc_validator']").each(function() {
			var validator = new ccValidator(this);
			validators.push(validator);
		});
		
	})(); // end init
	
	
	return validators;
})();
