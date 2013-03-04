soysauce.lazyloader = (function() {
	
	function Lazyloader(selector) {
		var options = soysauce.getOptions(selector);
		var self = this;
		
		this.widget = $(selector);
		this.id = parseInt(this.widget.attr("data-ss-id"));
		this.images = this.widget.find("[data-ss-ll-src]");
		this.vertical = true;
		this.horizontal = false; // Implement later for horizontal scrolling sites (i.e tablet)
		this.context = window; // Perhaps later we'll want to change the context
		this.threshold = 100;
		
		if (options) options.forEach(function(option) {
			switch(option) {
				case "option1":
					break;
			}
		});
		
		this.update();
		
		$(window).scroll(function() {
			if (self.images.length) self.update();
		});
	};
	
	Lazyloader.prototype.update = function() {
		var top = $(document).scrollTop();
		var contextTop = top - this.threshold;
		var contextBottom = top + this.threshold + $(this.context).height();
		this.images.each(function(i, image) {
			if ((image.offsetTop + image.height > contextTop) && (image.offsetTop < contextBottom)) {
				soysauce.lateload(image);
			}
		});
		this.images = this.widget.find("[data-ss-ll-src]");
	};
	
	Lazyloader.prototype.handleResize = function() {
		// Placeholder - required soysauce function
	};
	
	return {
		init: function(selector) {
			return new Lazyloader(selector);
		}
	};
	
})();
