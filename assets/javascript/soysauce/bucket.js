soysauce.carousels = (function() {
	var carousels = new Array();
	
	function Carousel(obj) {
		this.id = $(obj).attr("ss-id");
		this.container;
		this.items;
		this.infinite = true;
		this.autoscroll = false;
		this.fullscreen = false;
		this.peek = false;
		this.peekWidth = 0;
		this.dots = false;
		this.swipe = true;
		this.numChildren = 0;
		this.index = 0;
		this.supports3d = (navigator.userAgent.match(/android/i) !== null) ? false : true;
		this.itemWidth = 0;
		this.offset = 0;
		this.ready = false;
	}
	
	Carousel.prototype.goto = function(x, forward, fast) {
		var self = this;
		this.offset = x;
		this.setStyle(x);
		
		if (this.ready)
			this.container.attr("ss-state", "ready");
		else
			this.container.attr("ss-state", (fast) ? "intransit-fast" : "intransit");
	
		if (this.infinite) {
			if (this.index == this.numChildren - 2 && !forward)  {
				var xcoord = parseInt(soysauce.getArrayFromMatrix(this.container.css("webkitTransform"))[4]);
				var newOffset = -self.index*self.itemWidth;
				self.container.attr("ss-state", "notransition");
				self.offset = newOffset + xcoord;
				self.setStyle(self.offset);
				window.setTimeout(function() {
					self.container.attr("ss-state", "intransit");
					self.setStyle(newOffset);
					self.offset = newOffset;
				}, 0);
			}
			else if (this.index == 1 && forward)  {
				var xcoord = parseInt(soysauce.getArrayFromMatrix(this.container.css("webkitTransform"))[4]);
				var newOffset = self.offset + self.itemWidth - xcoord;
				self.container.attr("ss-state", "notransition");
				self.offset = -newOffset + xcoord;
				self.setStyle(-newOffset);
				window.setTimeout(function() {
					self.container.attr("ss-state", "intransit");
					self.setStyle(-self.itemWidth);
					self.offset = -self.itemWidth;
				}, 0);
			}	
		}
	};
	
	Carousel.prototype.slideForward = function(fast) {
		if (!this.ready || (!this.infinite && this.index == this.numChildren - 1)) return false;
		
		$(this.items[this.index++]).attr("ss-state", "inactive");
		
		if (this.infinite && this.index == this.numChildren - 1) {
			$(this.items[1]).attr("ss-state", "active");
			this.index = 1;
		}
		else
			$(this.items[this.index]).attr("ss-state", "active");
		
		this.ready = false;
		this.goto(this.offset - this.itemWidth, true, fast);
		
		return true;
	};
	
	Carousel.prototype.slideBackward = function(fast) {
		if (!this.ready || (!this.infinite && this.index == 0)) return false;
		
		$(this.items[this.index--]).attr("ss-state", "inactive");
		
		if (this.infinite && this.index == 0) {
			$(this.items[this.numChildren - 2]).attr("ss-state", "active");
			this.index = this.numChildren - 2;
		}
		else
			$(this.items[this.index]).attr("ss-state", "active");
		
		this.ready = false;
		this.goto(this.offset + this.itemWidth, false, fast);
		
		return true;
	};
	
	Carousel.prototype.adjustSize = function() {
		if (this.infinite)
			this.container.width(this.itemWidth * (this.numChildren + 2));
		else
			this.container.width(this.itemWidth * this.numChildren);
		this.itemWidth = $(window).width();
		this.container.find("[ss-component='item']").width(this.itemWidth);
	};
	
	Carousel.prototype.setStyle = function(x) {
		this.container[0].style.webkitTransform = this.container[0].style.msTransform = this.container[0].style.OTransform = this.container[0].style.MozTransform = this.container[0].style.transform = "translate" + ((this.supports3d) ? "3d(" : "(") + x + "px,0,0)";
	};
	
	Carousel.prototype.handleInterrupt = function(e) {
		var self = this;
		var coords1, coords2, ret;
		var xcoord = parseInt(soysauce.getArrayFromMatrix(this.container.css("webkitTransform"))[4]);
		this.container.attr("ss-state", "notransition");
		this.setStyle(xcoord);
		
		coords1 = soysauce.getCoords(e);
		
		this.container.on("touchmove mousemove", function(e2) {
			var dragOffset;

			ret = coords2 = soysauce.getCoords(e2.originalEvent);
			dragOffset = coords1.x - coords2.x;
			self.container.attr("ss-state", "notransition");
			self.setStyle(xcoord - dragOffset);
		});
		
		return ret;
	};
	
	Carousel.prototype.handleSwipe = function(e1) {
		var self = this;
		var coords1, coords2, lastX;
		
		soysauce.stifle(e1);
		coords1 = soysauce.getCoords(e1);
		
		if (!this.ready)
			lastX = this.handleInterrupt(e1);
		else {
			this.container.on("touchmove mousemove", function(e2) {
				var dragOffset;

				coords2 = soysauce.getCoords(e2.originalEvent);
				lastX = coords2.x;
				dragOffset = coords1.x - coords2.x;
				self.container.attr("ss-state", "notransition");
				self.setStyle(self.offset - dragOffset);
			});
		}
		
		this.container.one("touchend mouseup", function(e2) {
			coords2 = soysauce.getCoords(e2.originalEvent);
			
			if (coords2 !== null) lastX = coords2.x;
			
			console.log(e1);
			console.log(e2);
			
			var dist = coords1.x - lastX;
			var velocity = dist / (e2.timeStamp - e1.timeStamp);
			var fast = (velocity > 0.35) ? true : false;
			
			self.container.off("touchmove mousemove");
			self.ready = true;
			self.container.attr("ss-state", "ready");

			console.log(dist);

			if (Math.abs(dist) < 15)
				self.goto(self.offset, true);
			else if (dist > 0)
				self.slideForward(fast);
			else
				self.slideBackward(fast);
		});
	};
	
	Carousel.prototype.handleZoom = function(e) {
		console.log("zooming");
	};
	
	// Init
	(function() {
		$("[ss-widget='carousel']").each(function() {
			var carousel = new Carousel(this);
			var self = this;
			var options = soysauce.getOptions(this);
			var loadCounter = 1;
			var items = $(this).find("[ss-component='item']");
			var first_item, last_item;
			var wrapper;
			
			if(options) options.forEach(function(option) {
				switch(option) {
					case "peek":
						carousel.peek = true;
						break;
					case "finite":
						carousel.infinite = false;
						break;
					case "autoscroll":
						carousel.autoscroll = true;
						console.log("autoscroll enabled on: " + carousel.id);
						break;
					case "fullscreen":
						carousel.fullscreen = true;
						break;
					case "dots":
						carousel.dots = true;
						console.log("dots enabled on: " + carousel.id);
						break;
					case "noswipe":
						carousel.swipe = false;
						console.log("noswipe enabled on: " + carousel.id);
						break;
					case "zoom":
						console.log("zoom enabled on: " + carousel.id);
						carousel.zoom = true;
						break;
					case "3d":
						console.log("3d enabled on: " + carousel.id);
						carousel.supports3d = true;
						break;
				}
			});
			
			$(this).wrapInner("<div ss-component='container' />");
			$(this).wrapInner("<div ss-component='container_wrapper' />");
			carousel.container = $(this).find("[ss-component='container']");
			wrapper = $(this).find("[ss-component='container_wrapper']");
			wrapper.after("<div ss-component='button' ss-button-type='prev'></div><div ss-component='button' ss-button-type='next'></div>");
			
			wrapper.find("~ [ss-button-type='prev']").click(function() {
				carousel.slideBackward();
			});
			wrapper.find("~ [ss-button-type='next']").click(function() {
				carousel.slideForward();
			});
			
			if (carousel.infinite) {
				first_item = carousel.container.find("[ss-component='item']").first().clone().appendTo(carousel.container);
				last_item = carousel.container.find("[ss-component='item']").last().clone().prependTo(carousel.container);
				items = $(this).find("[ss-component='item']");
			}
			
			carousel.items = items;
			carousel.numChildren = items.length;
			
			if (carousel.peek) {
				carousel.peekWidth = ($(this).attr("ss-peek-width") !== undefined) ? parseInt($(this).attr("ss-peek-width")) : 0;
				if (carousel.peekWidth % 2) $(this).attr("ss-peek-width", ++carousel.peekWidth);
			}
			
			items.attr("ss-state", "inactive");
			if (carousel.infinite) {
				$(items[1]).attr("ss-state", "active");
				carousel.index++;
			}
			
			items.each(function(i) {
				function handleItem() {
					if (carousel.fullscreen)
						carousel.itemWidth = $(window).width();
					else
						carousel.itemWidth = (carousel.itemWidth != 0 && carousel.itemWidth < $(this).width()) ? carousel.itemWidth : $(this).width();
					
					if (loadCounter++ == carousel.numChildren) {
						$(self).find("[ss-component='item']").width(carousel.itemWidth - carousel.peekWidth);
						carousel.container.width(carousel.itemWidth * (carousel.numChildren));
						if (carousel.peek) {
							carousel.itemWidth -= carousel.peekWidth;
							carousel.offset += carousel.peekWidth/2;
						}
						if (carousel.infinite) 
							carousel.goto(-carousel.itemWidth + carousel.offset);							
						else
							carousel.goto(carousel.offset);
						
						window.setTimeout(function() {
							$(self).trigger("SSWidgetReady").attr("ss-state", "ready");
						}, 1);
					}
				}
				if (this.tagName.match(/img/i) !== undefined) 
					$(this).load(handleItem);
				else 
					handleItem();
					
				if (i == 0 && !carousel.infinite) $(this).attr("ss-state", "active");
			});
			
			if (carousel.fullscreen) $(window).on("resize orientationchange", function() {
				carousel.adjustSize();
			});
			
			if (carousel.swipe && carousel.zoom) carousel.container.on("touchstart mousedown", function(e1) {
				soysauce.stifle(e1);
				carousel.container.one("touchend mouseup touchmove mousemove", function(e2) {
					(e2.timeStamp - e1.timeStamp > 200) ? carousel.handleSwipe(e1, e2) : carousel.handleZoom(e1);
				});
			});
			else if (carousel.swipe) carousel.container.on("touchstart mousedown", function(e) {
				carousel.handleSwipe(e.originalEvent);
			});
			else if (carousel.zoom) carousel.container.click(function(e) {
				carousel.handleZoom(e.originalEvent);
			});
			
			carousel.ready = true;
			carousel.container.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
				carousel.ready = true;
				carousel.container.attr("ss-state", "ready");
			});
			
			// implement with play/pause functionality
			// if (carousel.autoscroll) setTimeout(function() {
			// 				carousel.slideForward();
			// 			}, 5000);
			
			carousels.push(carousel);
		});
	})(); // end init
	
	return carousels;
})();
