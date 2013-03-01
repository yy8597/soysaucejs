soysauce.lazyload = (function() {
	
	function Lazyload(selector) {
		var options = soysauce.getOptions(selector);
		var self = this;
		
		this.widget = $(selector);
		this.id = parseInt(this.widget.attr("data-ss-id"));
		this.loaded = false;
		this.placeholder;
		
		if (options) options.forEach(function(option) {
			switch(option) {
				case "option1":
					break;
			}
		});

	};
	
	return {
		init: function(selector) {
			return new Lazyload(selector);
		}
	};
	
})();
