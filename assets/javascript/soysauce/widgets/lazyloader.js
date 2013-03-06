soysauce.lazyloader = (function() {
	var THROTTLE = 100; // milliseconds
	
	function Lazyloader(selector) {
		var options = soysauce.getOptions(selector);
		var self = this;
		
		this.widget = $(selector);
		this.id = parseInt(this.widget.attr("data-ss-id"));
		this.images = this.widget.find("[data-ss-ll-src]");
		this.vertical = true;
		this.horizontal = false; // Implement later for horizontal scrolling sites (i.e tablet)
		this.context = window; // Perhaps later we'll want to change the context
		this.threshold = (!this.widget.attr("data-ss-threshold")) ? 100 : parseInt(this.widget.attr("data-ss-threshold"));
		this.timeStamp = 0; // for throttling
		
		if (options) options.forEach(function(option) {
			switch(option) {
				case "option1":
					break;
			}
		});
		
		this.update(0);
		
		$(window).scroll(update);
		
		function update(e) {
			if ((e.timeStamp - self.timeStamp) > THROTTLE) {
				if (self.images.length === 0) {
					$(window).unbind("scroll", update);
					return;
				}
				self.timeStamp = e.timeStamp;
				self.update($(document).scrollTop());
			}
		}
	};
	
	Lazyloader.prototype.update = function(top) {
		var contextTop = top - this.threshold;
		var contextBottom = top + this.threshold + this.context.innerHeight;
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
