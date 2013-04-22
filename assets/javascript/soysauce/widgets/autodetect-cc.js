soysauce.autodetectCC = (function() {
	
	function autodetectCC(selector) {
		var options = soysauce.getOptions(selector);
		var self = this;
		
		this.type = "Autodetect-CC";
		this.widget = $(this);
		this.id = parseInt($(selector).attr("data-ss-id"));
		this.input = $(selector);
		this.prediction;
		this.result;
		this.format = false;
		
		if (options) options.forEach(function(option) {
			switch(option) {
				case "format":
					self.format = true;
					break;
			}
		});
		
		if (this.format) {
			this.input.attr("maxlength", "19");
		}
		else {
			this.input.attr("maxlength", "16");
		}
		
		if (this.format && soysauce.vars.degrade) {
			this.input.on("keydown", function(e) {
				var keycode = e.keyCode ? e.keyCode : e.which;
				if (keycode !== 8 && keycode !== 46 && keycode !== 91 && keycode !== 17 && keycode !== 189) {
					soysauce.stifle(e);
					self.input.val(this.value + String.fromCharCode(e.keyCode));
				}
			});
		}
		
		this.input.on("keyup change", function(e) {
			var card_num = e.target.value.replace(/[-\s]+/g, "");
			var keycode = e.keyCode ? e.keyCode : e.which;
			
			// State 1 - Prediction
			if (card_num.length < 4) {
				if (card_num.match(/^4/)) {
					self.prediction = "visa";
				} 
				else if (card_num.match(/^5/)) {
					self.prediction = "mastercard";
				} 
				else if (card_num.match(/^6/)) {
					self.prediction = "discover";
				} 
				else if (card_num.match(/^3/)) {
					if (card_num.length === 1) {
						self.prediction = "amex dinersclub jcb";
					}
					else {
						if (card_num.match(/^3(4|7)/)) {
							self.prediction = "amex";
						}
						else if (card_num.match(/^3(0|8)/)) {
							self.prediction = "dinersclub";
						}
						else if (card_num.match(/^35/)) {
							self.prediction = "jcb";
						}
					}
				}
				else {
					self.prediction = undefined;
				}
				$(e.target).trigger("SSPrediction");
			} 
			else if (card_num.length === 0) {
				self.prediction = undefined;
			}

			// State 2 - Result
			if (card_num.length > 12 && validCC(card_num)) {
				if (card_num.match(/^4[0-9]{12}(?:[0-9]{3})?$/)) {
					self.result = "visa";
					$(e.target).trigger("SSResult");
				} else if (card_num.match(/^5[1-5][0-9]{14}$/)) {
					self.result = "mastercard";
					$(e.target).trigger("SSResult");
				} else if (card_num.match(/^3[47][0-9]{13}$/)) {
					self.result = "amex";
					$(e.target).trigger("SSResult");
				} else if (card_num.match(/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/)) {
					self.result = "dinersclub";
					$(e.target).trigger("SSResult");
				} else if (card_num.match(/^6(?:011|5[0-9]{2})[0-9]{12}$/)) {
					self.result = "discover";
					$(e.target).trigger("SSResult");
				} else if (card_num.match(/^(?:2131|1800|35\d{3})\d{11}$/)) {
					self.result = "jcb";
					$(e.target).trigger("SSResult");
				} else {
					self.result = undefined;
					$(e.target).trigger("SSResult");
				}
			}
			else {
				var resultChanged = (self.result !== undefined) ? true : false;
				self.result = undefined;
				if (self.prediction === "visa" && card_num.length === 16 ||
						self.prediction === "mastercard" && card_num.length === 16 ||
						self.prediction === "amex" && card_num.length === 15 ||
						self.prediction === "dinersclub" && card_num.length === 16 ||
						self.prediction === "discover" && card_num.length === 14 ||
						self.prediction === "jcb" && card_num.length === 16 ||
						!self.prediction && card_num.length === 16 || resultChanged) {
					$(e.target).trigger("SSResult");
				}
			}
			
			// keycodes: 8 = backspace, 46 = delete, 91 = command, 17 = ctrl, 189 = dash
			if (self.format && card_num.length > 3 && 
				keycode !== 8 && keycode !== 46 && keycode !== 91 && keycode !== 17 && keycode !== 189) {
				self.formatInput(e);
			}
			
		});
	}
	
	autodetectCC.prototype.formatInput = function(e) {
		var val = this.input.val().replace(/[\s]+/g, "");
		var isAmex = (/^3[47]/.test(val.replace(/[-\s]+/g, ""))) ? true : false;
		var isDC = (/^3(?:0[0-5]|[68][0-9])/.test(val.replace(/[-\s]+/g, "")) && !isAmex) ? true : false;
		
		if (soysauce.vars.degrade) {
			setCursorToEnd(this.input[0]);
		}
		
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
	
	function setCursorToEnd(input) {
		var index = input.length;
		input.setSelectionRange(19, 19);
	}
	
	// Luhn Algorithm, Copyright (c) 2011 Thomas Fuchs, http://mir.aculo.us
	// https://gist.github.com/madrobby/976805
	function validCC(a,b,c,d,e){for(d=+a[b=a.length-1],e=0;b--;)c=+a[b],d+=++e%2?2*c%10+(c>4):c;return!(d%10)};
	
	return {
		init: function(selector) {
			return new autodetectCC(selector);
		}
	};
	
})();
