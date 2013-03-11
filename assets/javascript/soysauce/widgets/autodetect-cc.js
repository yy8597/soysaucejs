soysauce.autodetectCC = (function() {
	
	function autodetectCC(selector) {
		var options = soysauce.getOptions(selector);
		var self = this;
		
		this.widget = $(this);
		this.id = parseInt($(selector).attr("data-ss-id"));
		this.input = $(selector);
		this.state1;
		this.state2;
		this.format = false;
		
		if (options) options.forEach(function(option) {
			switch(option) {
				case "format":
					self.format = true;
					break;
			}
		});
		
		this.input.attr("maxlength", "19");
		
		this.input.on("keyup change", function(e) {
			var card_num = e.target.value.replace(/-/g, "");
			var keycode = e.keyCode ? e.keyCode : e.which;
			
			// State 1
			if (card_num.length === 1) {
				if (card_num.match(/^4/)) {
					self.state1 = "visa";
				} else if (card_num.match(/^5/)) {
					self.state1 = "mastercard";
				} else if (card_num.match(/^3/)) {
					self.state1 = "amex dinersclub jcb";
				} else if (card_num.match(/^6/)) {
					self.state1 = "discover";
				} else {
					self.state1 = undefined;
				}
				$(e.target).trigger("SSDetect1");
			} 
			else if (card_num.length === 0) {
				self.state1 = undefined;
			}

			// State 2
			if (card_num.length > 12 && validCC(card_num)) {
				if (card_num.match(/^4[0-9]{12}(?:[0-9]{3})?$/)) {
					self.state2 = "visa";
					$(e.target).trigger("SSDetect2");
				} else if (card_num.match(/^5[1-5][0-9]{14}$/)) {
					self.state2 = "mastercard";
					$(e.target).trigger("SSDetect2");
				} else if (card_num.match(/^3[47][0-9]{13}$/)) {
					self.state2 = "amex";
					$(e.target).trigger("SSDetect2");
				} else if (card_num.match(/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/)) {
					self.state2 = "dinersclub";
					$(e.target).trigger("SSDetect2");
				} else if (card_num.match(/^6(?:011|5[0-9]{2})[0-9]{12}$/)) {
					self.state2 = "discover";
					$(e.target).trigger("SSDetect2");
				} else if (card_num.match(/^(?:2131|1800|35\d{3})\d{11}$/)) {
					self.state2 = "jcb";
					$(e.target).trigger("SSDetect2");
				}
			}
			else {
				self.state2 = undefined;
			}
			
			if (self.format && card_num.length > 3 && keycode !== 8 && keycode !== 46) {
				self.formatInput();
			}
			
		});
	}
	
	autodetectCC.prototype.formatInput = function() {
		var val = this.input.val();
		var count = val.replace(/-/g, "").length;
		var isAmex = (/^3[47]/.test(val.replace(/-/g, ""))) ? true : false;
		var isDC = (/^3(?:0[0-5]|[68][0-9])/.test(val.replace(/-/g, "")) && !isAmex) ? true : false;
		
		if (	count === 4 ||
					count === 8 && !isDC && !isAmex ||
					count === 11 && isAmex ||
					count === 10 && isDC ||
					count === 12 && !isDC && !isAmex ) {
			val += "-";
			this.input.val(val);
		}
	};
	
	autodetectCC.prototype.handleResize = function() {
		// Placeholder - required soysauce function
	};
	
	// Luhn Algorithm, Copyright (c) 2011 Thomas Fuchs, http://mir.aculo.us
	// https://gist.github.com/madrobby/976805
	function validCC(a,b,c,d,e){for(d=+a[b=a.length-1],e=0;b--;)c=+a[b],d+=++e%2?2*c%10+(c>4):c;return!(d%10)};
	
	return {
		init: function(selector) {
			return new autodetectCC(selector);
		}
	};
	
})();
