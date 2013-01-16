

soysauce.carousels = (function() {
	var carousels = new Array();
	
	function Carousel(obj) {
		this.id = $(obj).attr("data-ss-id");
		this.container;
		this.items;
		this.dots;
		this.infinite = true;
		this.autoscroll = false;
		this.autoscrollID;
		this.autoscrollInterval = 5000;
		this.autoscrollRestartID;
		this.fullscreen = false;
		this.peek = false;
		this.peekWidth = 0;
		this.swipe = true;
		this.numChildren = 0;
		this.index = 0;
		this.supports3d = (/Android [12]|Opera/.test(navigator.userAgent)) ? false : true;
		this.itemWidth = 0;
		this.offset = 0;
		this.ready = false;
		this.interrupted = false;
		this.coords1x = 0;
		this.coords1y = 0;
		this.links = false;
		this.cms = false;
		this.zoom = false;
		this.zoomMultiplier = 2;
		this.isZoomed = false;
		this.panMax = {x:0, y:0};
		this.panCoords = {x:0, y:0};
		this.panCoordsStart = {x:0, y:0};
		this.panning = false;
		this.lockScroll = undefined;
		this.zoomIcon;
		this.nextBtn;
		this.prevBtn;
	}
	
	Carousel.prototype.gotoPos = function(x, forward, fast) {
		var self = this;
		this.offset = x;
		this.setStyle(x);
		
		if (this.ready)
			this.container.attr("data-ss-state", "ready");
		else
			this.container.attr("data-ss-state", (fast) ? "intransit-fast" : "intransit");
	
		if (this.infinite) {
			if (this.index === this.numChildren - 2 && !forward)  {
				var xcoord = parseInt(soysauce.getArrayFromMatrix(this.container.css("-webkit-transform"))[4]);
				var newOffset = -self.index*self.itemWidth;
				self.container.attr("data-ss-state", "notransition");
				self.offset = newOffset + xcoord;
				self.setStyle(self.offset);
				window.setTimeout(function() {
					self.container.attr("data-ss-state", "intransit");
					self.offset = newOffset + self.peekWidth/2;
					self.setStyle(self.offset);
				}, 0);
			}
			else if (this.index === 1 && forward)  {
				var xcoord = parseInt(soysauce.getArrayFromMatrix(this.container.css("-webkit-transform"))[4]);
				var newOffset = self.offset + self.itemWidth - xcoord;
				self.container.attr("data-ss-state", "notransition");
				self.offset = -newOffset + xcoord;
				self.setStyle(-newOffset);
				window.setTimeout(function() {
					self.container.attr("data-ss-state", "intransit");
					self.offset = -self.itemWidth + self.peekWidth/2;
					self.setStyle(self.offset);
				}, 0);
			}	
		}
		
		if (self.interrupted)
			this.container.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
				self.interrupted = false;
			});
		
		if (self.autoscroll && self.autoscrollRestartID === undefined)
			this.container.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
					self.autoscrollRestartID = window.setTimeout(function() {
						self.autoscrollOn();
					}, 1000);
			});
			
	};
	
	Carousel.prototype.slideForward = function(fast) {
		if (!this.ready || (!this.infinite && this.index === this.numChildren - 1) || this.isZoomed) return false;
		
		if (this.infinite)
			$(this.dots[this.index - 1]).attr("data-ss-state", "inactive");
		else
			$(this.dots[this.index]).attr("data-ss-state", "inactive");
			
		$(this.items[this.index++]).attr("data-ss-state", "inactive");
		
		if (this.infinite && this.index === this.numChildren - 1) {
			$(this.items[1]).attr("data-ss-state", "active");
			this.index = 1;
		}
		else
			$(this.items[this.index]).attr("data-ss-state", "active");
		
		if ((this.offset / this.itemWidth) % 1 !== 0)
			this.offset = -this.itemWidth * (this.index - (this.infinite) ? 0 : 1);
		
		if (this.infinite)
			$(this.dots[this.index - 1]).attr("data-ss-state", "active");
		else {
			$(this.dots[this.index]).attr("data-ss-state", "active");
			if (this.index === this.numChildren - 1)
				this.nextBtn.attr("data-ss-state", "disabled");
			if (this.numChildren > 1)
				this.prevBtn.attr("data-ss-state", "enabled");
		}
			
		this.ready = false;
		this.gotoPos(this.offset - this.itemWidth, true, fast);
		
		return true;
	};
	
	Carousel.prototype.slideBackward = function(fast) {
		if (!this.ready || (!this.infinite && this.index === 0) || this.isZoomed) return false;
		
		if (this.infinite)
			$(this.dots[this.index - 1]).attr("data-ss-state", "inactive");
		else
			$(this.dots[this.index]).attr("data-ss-state", "inactive");
			
		$(this.items[this.index--]).attr("data-ss-state", "inactive");
		
		if (this.infinite && this.index === 0) {
			$(this.items[this.numChildren - 2]).attr("data-ss-state", "active");
			this.index = this.numChildren - 2;
		}
		else
			$(this.items[this.index]).attr("data-ss-state", "active");
		
		if ((this.offset / this.itemWidth) % 1 !== 0)
			this.offset = -this.itemWidth * (this.index - (this.infinite) ? 0 : 1);
		
		if (this.infinite)
			$(this.dots[this.index - 1]).attr("data-ss-state", "active");
		else {
			$(this.dots[this.index]).attr("data-ss-state", "active");
			if (this.index === 0)
				this.prevBtn.attr("data-ss-state", "disabled");
			if (this.numChildren > 1)
				this.nextBtn.attr("data-ss-state", "enabled");
		}
			
		this.ready = false;
		this.gotoPos(this.offset + this.itemWidth, false, fast);
		
		return true;
	};
	
	Carousel.prototype.adjustSize = function() {
		if (this.fullscreen) {
			var diff = $(window).width() - this.itemWidth;
			var prevState = this.container.attr("data-ss-state");
			var self = this;
			this.itemWidth -= this.peekWidth;
			this.itemWidth += diff;
			this.offset = -this.index * this.itemWidth + this.peekWidth/2;
			this.container.attr("data-ss-state", "notransition");
			this.setStyle(this.offset);			
			this.container.find("[data-ss-component='item']").width(this.itemWidth);
		}

		if (this.infinite)
			this.container.width(this.itemWidth * (this.numChildren + 2));
		else
			this.container.width(this.itemWidth * this.numChildren);
			
		if (this.zoom) {
			this.panMax.x = this.itemWidth / this.zoomMultiplier;	
			this.panMax.y = this.container.find("[data-ss-component]").height() / this.zoomMultiplier;				
		}
	};
	
	Carousel.prototype.setStyle = function(x) {
		this.container[0].style.webkitTransform = this.container[0].style.msTransform = this.container[0].style.OTransform = this.container[0].style.MozTransform = this.container[0].style.transform = "translate" + ((this.supports3d) ? "3d(" + x + "px,0,0)": "(" + x + "px,0)");
	};
	
	Carousel.prototype.handleInterrupt = function(e) {
		if (this.isZoomed || !this.swipe) {
			soysauce.stifle(e);
			return;
		}
		
		var self = this;
		var coords1, coords2, ret;
		var xcoord = parseInt(soysauce.getArrayFromMatrix(this.container.css("-webkit-transform"))[4]);
		
		this.interrupted = true;
		
		if (this.autoscroll) {
			this.autoscrollOff();
			if (this.autoscrollRestartID !== undefined) {
				window.clearInterval(self.autoscrollRestartID);
				self.autoscrollRestartID = undefined;
			}
		}
		
		this.container.attr("data-ss-state", "notransition");
		this.setStyle(xcoord);
		
		coords1 = soysauce.getCoords(e);
		
		this.container.closest("[data-ss-widget='carousel']").on("touchmove mousemove", function(e2) {
			if (self.isZoomed) {
				soysauce.stifle(e);
				soysauce.stifle(e2);
				return;
			}
			
			if (self.lockScroll === "y")
				return;
			
			var dragOffset;

			ret = coords2 = soysauce.getCoords(e2);
			
			if (Math.abs((coords1.y - coords2.y)/(coords1.x - coords2.x)))
				soysauce.stifle(e);
			else
				soysauce.stifle(e2);
			
			dragOffset = coords1.x - coords2.x;
			self.container.attr("data-ss-state", "notransition");
			self.setStyle(xcoord - dragOffset);
		});
		
		this.container.closest("[data-ss-widget='carousel']").on("touchend mouseup", function(e2) {
			ret = coords2 = soysauce.getCoords(e2);
			if (Math.abs(coords1.x - coords2.x) === 0) {
				self.interrupted = false;
				self.ready = true;
			}
		});
		
		return ret;
	};
	
	Carousel.prototype.handleSwipe = function(e1) {
		var self = this;
		var coords1, coords2, lastX;
		
		var coords1x;
		
		coords1 = soysauce.getCoords(e1);
		
		this.coords1x = coords1.x;
		this.coords1y = coords1.y;
		
		if (e1.type.match(/mousedown/) !== null) soysauce.stifle(e1); // for desktop debugging

		if (!this.ready) 
			lastX = this.handleInterrupt(e1);
		else {
			self.lockScroll = undefined;
			if (this.zoom && this.isZoomed) {
				this.container.closest("[data-ss-widget='carousel']").on("touchend mouseup", function(e2) {
					self.panCoordsStart.x = (Math.abs(parseInt(soysauce.getArrayFromMatrix($(e2.target).css("-webkit-transform"))[4])) > 0) ? parseInt(soysauce.getArrayFromMatrix($(e2.target).css("-webkit-transform"))[4]) : 0;
					self.panCoordsStart.y = (Math.abs(parseInt(soysauce.getArrayFromMatrix($(e2.target).css("-webkit-transform"))[5])) > 0) ? parseInt(soysauce.getArrayFromMatrix($(e2.target).css("-webkit-transform"))[5]) : 0;
				});
				this.container.closest("[data-ss-widget='carousel']").on("touchmove mousemove", function(e2) {
					soysauce.stifle(e2);
					
					coords2 = soysauce.getCoords(e2);
					$(e2.target).attr("data-ss-state", "panning");
					
					self.panCoords.x = self.panCoordsStart.x + coords2.x - self.coords1x;
					self.panCoords.y = self.panCoordsStart.y + coords2.y - self.coords1y;
					
					if (Math.abs(self.panCoords.x) > self.panMax.x && self.panCoords.x > 0)
						self.panCoords.x = self.panMax.x;
					else if (Math.abs(self.panCoords.x) > self.panMax.x && self.panCoords.x < 0)
						self.panCoords.x = -self.panMax.x;
						
					if (Math.abs(self.panCoords.y) > self.panMax.y && self.panCoords.y > 0)
						self.panCoords.y = self.panMax.y;
					else if (Math.abs(self.panCoords.y) > self.panMax.y && self.panCoords.y < 0)
						self.panCoords.y = -self.panMax.y;	
					
					e2.target.style.webkitTransform = e2.target.style.msTransform = e2.target.style.OTransform = e2.target.style.MozTransform = e2.target.style.transform 
					= "translate" + ((self.supports3d) ? "3d(" + self.panCoords.x + "px," + self.panCoords.y + "px,0)" : "(" + self.panCoords.x + "px," + self.panCoords.y + "px)") + " scale" + ((self.supports3d) ? "3d(" + self.zoomMultiplier + "," + self.zoomMultiplier + ",1)" : "(" + self.zoomMultiplier + "," + self.zoomMultiplier + ")"); 
				});
			}
			else if (this.swipe) this.container.closest("[data-ss-widget='carousel']").on("touchmove mousemove", function(e2) {
				var dragOffset;
				
				coords2 = soysauce.getCoords(e2);
				
				if (self.lockScroll === undefined) {
					if (Math.abs((coords1.y - coords2.y)/(coords1.x - coords2.x)) > 1.2)
						self.lockScroll = "y";
					else
						self.lockScroll = "x";
				}
				
				if (self.lockScroll === "y")
					return;
				
				if (Math.abs((coords1.y - coords2.y)/(coords1.x - coords2.x)))
					soysauce.stifle(e1);
				else
					soysauce.stifle(e2);
				
				self.panning = true;
				lastX = coords2.x;
				dragOffset = coords1.x - coords2.x;
				self.container.attr("data-ss-state", "notransition");
				self.setStyle(self.offset - dragOffset);
			});
		}

		this.container.closest("[data-ss-widget='carousel']").one("touchend mouseup", function(e2) {
			soysauce.stifle(e2);
			
			if ($(e2.target).hasAttr("data-ss-button-type")) return;
			
			coords2 = soysauce.getCoords(e2);
			if (coords2 !== null) lastX = coords2.x;

			var xDist = self.coords1x - lastX;
			var yDist = self.coords1y - coords2.y;
			
			var velocity = xDist / (e2.timeStamp - e1.timeStamp);
			var fast = (velocity > 0.9) ? true : false;
			
			self.container.closest("[data-ss-widget='carousel']").off("touchmove mousemove");
			
			if (!self.interrupted && self.links && Math.abs(xDist) === 0) {
				self.ready = true;
				self.container.attr("data-ss-state", "ready");
				if (e2.target.tagName.match(/^a$/i) !== null)
					window.location.href = $(e2).attr("href");
				else
					window.location.href = $(e2.target).closest("a").attr("href");
			}
			else if (!self.interrupted && self.zoom && ((Math.abs(xDist) < 3 && Math.abs(yDist) < 3) || self.isZoomed)) {
				soysauce.stifle(e1);
				self.handleZoom(e1, e2, Math.abs(xDist), Math.abs(yDist));
			}
			else if (Math.abs(xDist) < 15 || (self.interrupted && Math.abs(xDist) < 25)) {
				soysauce.stifle(e1);
				self.ready = true;
				self.container.attr("data-ss-state", "ready");
				self.gotoPos(self.offset, true);
			}
			else if (Math.abs(xDist) > 3 && self.swipe) {
				self.ready = true;
				self.container.attr("data-ss-state", "ready");
				
				if (self.lockScroll === "y")
					return;
				
				if (xDist > 0) {
					if (!self.infinite && self.index === self.numChildren - 1)
						self.gotoPos(self.index * -self.itemWidth);
					else
						self.slideForward(fast);
				}
				else {
					if (!self.infinite && self.index === 0)
						self.gotoPos(0);
					else
						self.slideBackward(fast);
				}
			}
		});
	};
	
	Carousel.prototype.handleZoom = function(e1, e2, xDist, yDist) {
		if (!this.ready && !(this.isZoomed && xDist < 3 && yDist < 3) || (e1.type.match(/touch/) !== null && e2.type.match(/mouse/) !== null)) {
			soysauce.stifle(e1);
			soysauce.stifle(e2);
			return;
		}
		
		var zoomImg = this.container.find("[data-ss-component='item'][data-ss-state='active'] img")[0];
		zoomImg = (zoomImg === undefined) ? this.container.find("[data-ss-component='item'][data-ss-state='active']")[0] : zoomImg;
		
		var self = this;
		$(zoomImg).attr("data-ss-state", "ready");
		
		if (!this.isZoomed) {
			var offset = 0;

			if ($(e2.target).attr("data-ss-component") === "zoom_icon") {
				self.panCoords = {x: 0, y: 0};
				self.panCoordsStart = {x: 0, y: 0};
			}
			else {
				self.panCoords = soysauce.getCoords(e2);
				self.panCoords.x -= self.itemWidth/2;
				self.panCoords.x *= -self.zoomMultiplier;

				if (e1.type.match(/mousedown/i) !== null) {
					if (e1.originalEvent !== undefined) 
						offset = e1.originalEvent.offsetY;
					else 
						offset = e1.offsetY;
				}
				else {
					if (e1.originalEvent !== undefined) 
						offset = e1.originalEvent.pageY - $(e1.target).offset().top;
					else 
						offset = e1.pageY - $(e1.target).offset().top;
				}

				self.panCoords.y = (self.container.find("[data-ss-component='item']").height() / self.zoomMultiplier) - offset;
				self.panCoords.y *= self.zoomMultiplier;

				if (Math.abs(self.panCoords.x) > self.panMax.x && self.panCoords.x > 0)
					self.panCoords.x = self.panMax.x;
				else if (Math.abs(self.panCoords.x) > self.panMax.x && self.panCoords.x < 0)
					self.panCoords.x = -self.panMax.x;

				if (Math.abs(self.panCoords.y) > self.panMax.y && self.panCoords.y > 0)
					self.panCoords.y = self.panMax.y;
				else if (Math.abs(self.panCoords.y) > self.panMax.y && self.panCoords.y < 0)
					self.panCoords.y = -self.panMax.y;

				self.panCoordsStart.x = self.panCoords.x;
				self.panCoordsStart.y = self.panCoords.y;
			}
			
			if (self.panCoords.x !== NaN && self.panCoords.y !== NaN) {
				this.ready = false;
				this.container.closest("[data-ss-widget='carousel']").attr("data-ss-state", "zoomed");
				this.zoomIcon.attr("data-ss-state", "in");
				zoomImg.style.webkitTransform = zoomImg.style.msTransform = zoomImg.style.OTransform = zoomImg.style.MozTransform = zoomImg.style.transform 
				= "translate" + ((self.supports3d) ? "3d(" + self.panCoords.x + "px," + self.panCoords.y + "px,0)" : "(" + self.panCoords.x + "px," + self.panCoords.y + "px)") + " scale" + ((self.supports3d) ? "3d(" + self.zoomMultiplier + "," + self.zoomMultiplier + ",1)" : "(" + self.zoomMultiplier + "," + self.zoomMultiplier + ")"); 
				$(zoomImg).on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
					self.isZoomed = true;
				});
			}
		}
		else if (xDist < 3 && yDist < 3) {
			this.ready = false;
			this.container.closest("[data-ss-widget='carousel']").attr("data-ss-state", "ready");
			this.zoomIcon.attr("data-ss-state", "out");
			zoomImg.style.webkitTransform = zoomImg.style.msTransform = zoomImg.style.OTransform = zoomImg.style.MozTransform = zoomImg.style.transform 
			= "translate" + ((self.supports3d) ? "3d(0,0,0)" : "(0,0)") + " scale" + ((self.supports3d) ? "3d(1,1,1)" : "(1,1)") ;
			$(zoomImg).on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
				self.isZoomed = false;
			});
		}
		
		$(zoomImg).on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
			self.ready = true;
			self.interrupted = false;
		});
	};
	
	Carousel.prototype.autoscrollOn = function() {
		var self = this;
		if (this.autoscrollID === undefined) {
			this.autoscrollID = window.setInterval(function() {
				self.slideForward();
			}, self.autoscrollInterval);
			return true;
		}
		return false;
	};
	
	Carousel.prototype.autoscrollOff = function() {
		var self = this;
		if (this.autoscrollID !== undefined) {
			window.clearInterval(self.autoscrollID);
			this.autoscrollID = undefined;
			return true;
		}
		return false;
	};
	
	Carousel.prototype.reload = function(callback) {
		var self = this;
		var newCarousel = this.container.closest("[data-ss-widget='carousel']");
		carousels.forEach(function(e,i) {
			if (self.id === e.id)
				carousels.remove(i);
		});
		newCarousel.removeAttr("data-ss-state");
		callback();
		newCarousel.each(loadWidget);
		return true;
	};
	
	// Init
	(function() {
		$("[data-ss-widget='carousel']").each(loadWidget);
	})(); // end init
	
	function loadWidget() {
		var carousel = new Carousel(this);
		var self = this;
		var options = soysauce.getOptions(this);
		var loadCounter = 1;
		var items = $(this).find("[data-ss-component='item']");
		var first_item, last_item;
		var wrapper;
		var i = 0;
		
		if(options) options.forEach(function(option) {
			switch(option) {
				case "cms":
					carousel.cms = true;
					break;
				case "peek":
					carousel.peek = true;
					carousel.peekWidth = 40;
					break;
				case "finite":
					carousel.infinite = false;
					break;
				case "autoscroll":
					carousel.autoscroll = true;
					break;
				case "fullscreen":
					carousel.fullscreen = true;
					break;
				case "noswipe":
					carousel.swipe = false;
					break;
				case "zoom":
					carousel.zoom = true;
					break;
				case "3d":
					carousel.supports3d = true;
					break;
			}
		});
		
		// Deprecated List - swipe-disabled phones
		if (/android.*sgh-/i.test(navigator.userAgent)) {
			var newOptions = $(this).attr("data-ss-options");
			carousel.swipe = false;
			if (newOptions !== undefined)
				$(this).attr("data-ss-options", newOptions + " noswipe");
			else
				$(this).attr("data-ss-options", "noswipe");
		}
		
		if (carousel.cms) {
			var img_src = "";
			$(this).find("style").each(function(e) {
				var img = "";
			  img_src = $(this).html().match(/\/\/[\w_\.\/-]+-2x[\w\.\/]+/i)[0];
				img = "<img src='" + img_src + "'>"
				$(this).before(img);

				$(this).parent().attr("data-ss-component", "item")

				$(this).find("+ div").remove();
				$(this).remove();
			});
		}
		
		if (carousel.swipe) $(this).find("a").click(function(e) {
			soysauce.stifle(e);
		});
		$(this).wrapInner("<div data-ss-component='container' />");
		$(this).wrapInner("<div data-ss-component='container_wrapper' />");
		carousel.container = $(this).find("[data-ss-component='container']");
		wrapper = $(this).find("[data-ss-component='container_wrapper']");
		if (carousel.zoom) {
			wrapper.after("<div data-ss-component='zoom_icon' data-ss-state='out'></div>");
			carousel.zoomIcon = wrapper.find("~ [data-ss-component='zoom_icon']");
		}
		wrapper.after("<div data-ss-component='button' data-ss-button-type='prev' data-ss-state='disabled'></div><div data-ss-component='button' data-ss-button-type='next'></div>");
		wrapper.after("<div data-ss-component='dots'></div>")
		carousel.dots = $(this).find("[data-ss-component='dots']");
		
		carousel.nextBtn = wrapper.find("~ [data-ss-button-type='next']");
		carousel.prevBtn = wrapper.find("~ [data-ss-button-type='prev']");
		
		wrapper.find("~ [data-ss-button-type='prev']").click(function(e) {
			soysauce.stifle(e);
			if (carousel.ready && !carousel.interrupted)
				carousel.slideBackward();
		});
		wrapper.find("~ [data-ss-button-type='next']").click(function(e) {
			soysauce.stifle(e);
			if (carousel.ready && !carousel.interrupted)
				carousel.slideForward();
		});
		
		if (carousel.infinite) {
			first_item = carousel.container.find("[data-ss-component='item']").first().clone();
			last_item = carousel.container.find("[data-ss-component='item']").last().clone();
			first_item.appendTo(carousel.container);
			last_item.prependTo(carousel.container);
			items = $(this).find("[data-ss-component='item']");
		}
		
		carousel.items = items;
		carousel.numChildren = items.length;
		
		wrapper.find("~ [data-ss-button-type='next']").attr("data-ss-state", (carousel.numChildren > 1) ? "enabled" : "disabled");
		
		carousel.links = (items[0].tagName.match(/^a$/i) !== null) ? true : false;
		
		var dotsHtml = "";
		var numDots = (carousel.infinite) ? carousel.numChildren - 2 : carousel.numChildren;
		for (i = 0; i < numDots; i++) {
			dotsHtml += "<div data-ss-component='dot'></div>";
		}
		carousel.dots.html(dotsHtml);
		carousel.dots = carousel.dots.find("div");
		carousel.dots.attr("data-ss-state", "inactive")
		carousel.dots.first().attr("data-ss-state", "active");
		
		if (carousel.peek) {
			carousel.peekWidth = ($(this).attr("data-ss-peek-width") !== undefined) ? parseInt($(this).attr("data-ss-peek-width")) : 40;
			if (carousel.peekWidth % 2) $(this).attr("data-ss-peek-width", ++carousel.peekWidth);
		}
		
		items.attr("data-ss-state", "inactive");
		if (carousel.infinite) {
			$(items[1]).attr("data-ss-state", "active");
			carousel.index++;
		}
		
		items.each(function(i, e) {
			function handleChildren() {
				var loadCount = 0;
				var numImgs = $(e).find("img").length;
				$(e).find("img").ready(function() {
					loadCount++;
					if (++loadCount === numImgs || numImgs === 1)
						handleItem();
				});
			}
			function handleItem() {	
				if (carousel.fullscreen)
					carousel.itemWidth = $(window).width();
				else
					carousel.itemWidth = (carousel.itemWidth != 0 && carousel.itemWidth < $(this).width()) ? carousel.itemWidth : $(this).width();
				
				if (loadCounter++ === carousel.numChildren) {
					$(self).find("[data-ss-component='item']").width(carousel.itemWidth - carousel.peekWidth);
					carousel.container.width(carousel.itemWidth * (carousel.numChildren));
					if (carousel.peek) {
						carousel.itemWidth -= carousel.peekWidth;
						carousel.offset += carousel.peekWidth/2;
					}
					if (carousel.infinite) 
						carousel.gotoPos(-carousel.itemWidth + carousel.offset);							
					else
						carousel.gotoPos(carousel.offset);
					if (carousel.zoom) {
						var zoomMultiplier = $(this).attr("data-ss-zoom-multiplier");
						if (zoomMultiplier !== undefined)
							carousel.zoomMultiplier = parseInt(zoomMultiplier);
							
						carousel.panMax.x = carousel.itemWidth / carousel.zoomMultiplier;				
						carousel.panMax.y = $(self).find("[data-ss-component='item']").height() / carousel.zoomMultiplier;
						if (carousel.panMax.y === 0) {
							var imageToLoad = $(self).find("img")[0];
							$(imageToLoad).load(function() {
								carousel.panMax.y = imageToLoad.height / carousel.zoomMultiplier;
							});
						}
					}
					window.setTimeout(function() {
						$(self).trigger("SSWidgetReady").attr("data-ss-state", "ready");
					}, 1);
				}
			}
			if (e.tagName.match(/img/i) !== null)
				$(e).ready(handleItem());
			else if ($(e).find("img").length > 0)
				handleChildren();
			else
				handleItem();
				
			if (i === 0 && !carousel.infinite) $(this).attr("data-ss-state", "active");
		});
		
		if (carousel.fullscreen) $(window).on("resize orientationchange", function() {
			carousel.adjustSize();
		});
		
		if (carousel.swipe || carousel.zoom) carousel.container.closest("[data-ss-widget='carousel']").on("touchstart mousedown", function(e) {
			if ($(e.target).attr("data-ss-component") !== ("button" || "zoom_icon"))
				carousel.handleSwipe(e);
			else if ($(e.target).attr("data-ss-button-type") === "next" && carousel.ready)
				carousel.slideForward();
			else if ($(e.target).attr("data-ss-button-type") === "prev" && carousel.ready)
				carousel.slideBackward();
		});
		
		carousel.ready = true;
		carousel.container.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
			carousel.ready = true;
			carousel.container.attr("data-ss-state", "ready");
		});
		
		if (carousel.autoscroll) {
			var interval = $(this).attr("data-ss-autoscroll-interval");
			if (interval !== undefined)
				carousel.autoscrollInterval = parseInt(interval);
			carousel.autoscrollOn();
		}
		
		carousels.push(carousel);
	}
	
	return carousels;
})();
