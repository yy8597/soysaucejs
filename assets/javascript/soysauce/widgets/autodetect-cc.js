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
			
			// State 1 - Prediction
			if (card_num.length < 4) {
				if (card_num.match(/^4/)) {
					self.state1 = "visa";
				} 
				else if (card_num.match(/^5/)) {
					self.state1 = "mastercard";
				} 
				else if (card_num.match(/^6/)) {
					self.state1 = "discover";
				} 
				else if (card_num.match(/^3/)) {
					if (card_num.length === 1) {
						self.state1 = "amex dinersclub jcb";
					}
					else {
						if (card_num.match(/^3(4|7)/)) {
							self.state1 = "amex";
						}
						else if (card_num.match(/^3(0|8)/)) {
							self.state1 = "dinersclub";
						}
						else if (card_num.match(/^35/)) {
							self.state1 = "jcb";
						}
					}
				}
				$(e.target).trigger("SSDetect1");
			} 
			else if (card_num.length === 0) {
				self.state1 = undefined;
			}

			// State 2 - Result
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
			
			// keycodes: 8 = backspace, 46 = delete, 91 = command, 17 = ctrl, 189 = dash
			if (self.format && card_num.length > 3 && 
				keycode !== 8 && keycode !== 46 && keycode !== 91 && keycode !== 17 && keycode !== 189) {
				self.formatInput();
			}
			
		});
	}
	
	autodetectCC.prototype.formatInput = function() {
		var val = this.input.val();
		var isAmex = (/^3[47]/.test(val.replace(/-/g, ""))) ? true : false;
		var isDC = (/^3(?:0[0-5]|[68][0-9])/.test(val.replace(/-/g, "")) && !isAmex) ? true : false;
		
		if (isAmex || isDC) {
			if (val[4] !== undefined && val[4] !== "-") {
				val = insertStringAt("-", 4, val);
				this.input.val(val);
			}
			if (val[11] !== undefined && val[11] !== "-") {
				val = insertStringAt("-", 11, val);
				this.input.val(val);
			}
		}
		else {
			if (val[4] !== undefined && val[4] !== "-") {
				val = insertStringAt("-", 4, val);
				this.input.val(val);
			}
			if (val[9] !== undefined && val[9] !== "-") {
				val = insertStringAt("-", 9, val);
				this.input.val(val);
			}
			if (val[14] !== undefined && val[14] !== "-") {
				val = insertStringAt("-", 14, val)
				this.input.val(val);
			}
		}
		
		function insertStringAt(content, index, dest) {
			if (index > 0) {
				return dest.substring(0, index) + content + dest.substring(index, dest.length);
			}
			else {
				return content + dest;
			}
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
