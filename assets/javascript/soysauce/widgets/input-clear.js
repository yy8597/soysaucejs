soysauce.inputClear = (function() {
	
	function inputClear(selector) {
		var options = soysauce.getOptions(selector);
		var self = this;
		
		this.widget = $(selector);
		this.id = parseInt($(selector).attr("data-ss-id"));
		
		this.widget.on("focus keyup", function() {
			self.handleIcon();
		});
		
		this.widget.wrap("<span data-ss-component='input-wrapper'></span>").attr("data-ss-clear", "off");
		this.widget.after("<span data-ss-component='icon'></span>");
		this.widget.find("+ [data-ss-component='icon']").on("click", function() {
			self.clear();
		});
	}
	
	inputClear.prototype.clear = function() {
		this.widget.val("").attr("data-ss-clear", "off");
	};
	
	inputClear.prototype.handleIcon = function() {
		var self = this;
		var value = this.widget.val();
		
		if (!value.length) {
			this.widget.attr("data-ss-clear", "off");
			return;
		}
		else {
			this.widget.attr("data-ss-clear", "on");
		}
	};
	
	return {
		init: function(selector) {
			return new inputClear(selector);
		}
	};
	
})();
