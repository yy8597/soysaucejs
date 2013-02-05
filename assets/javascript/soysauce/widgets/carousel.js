soysauce.carousels = (function() {
	var carousels = new Array();
	
	// Shared Default Globals
	var SUPPORTS3D = (/Android [12]|Opera/.test(navigator.userAgent)) ? false : true;
	var AUTOSCROLL_INTERVAL = 5000;
	var ZOOM_MULTIPLIER = 2;
	var PEEK_WIDTH = 40;
	var TRANSITION_END = "transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd";
	var PINCH_SENSITIVITY = 1500; // lower to increase sensitivity for pinch zoom
	
	function Carousel(obj) {
		// Base Variables
		this.id = parseInt($(obj).attr("data-ss-id"));
		this.widget = $(obj);
		this.index = 0;
		this.maxIndex;
		this.container;
		this.items;
		this.dots;
		this.numChildren = 0;
		this.itemWidth = 0;
		this.offset = 0;
		this.ready = false;
		this.interrupted = false;
		this.links = false;
		this.lockScroll = undefined;
		this.nextBtn;
		this.prevBtn;
		this.freeze = false;
		
		// Infinite Variables
		this.infinite = true;
		this.autoscroll = false;
		this.autoscrollID;
		this.autoscrollInterval;
		this.autoscrollRestartID;
		this.infiniteID;
		this.forward;
		this.lastSlideTime;
		
		// Fullscreen & Peek Variables
		this.fullscreen = true;
		this.peek = false;
		this.peekWidth = 0;
		
		// Swipe Variables
		this.swipe = true;
		
		// Misc Variables
		this.coords1x = 0;
		this.coords1y = 0;
		
		// CMS Variables
		this.cms = false;
		
		// Zoom Variables
		this.zoom = false;
		this.zoomMultiplier;
		this.zoomMin;
		this.zoomMax;
		this.isZooming = false;
		this.isZoomed = false;
		this.panMax = {x:0, y:0};
		this.panMaxOriginal = {x:0, y:0};
		this.panCoords = {x:0, y:0};
		this.panCoordsStart = {x:0, y:0};
		this.panning = false;
		this.zoomIcon;
		this.pinch;
	}
	
	Carousel.prototype.gotoPos = function(x, fast, jumping) {
		var self = this;
		
		this.offset = x;
		setTranslate(this.container[0], x);
		
		if (this.ready)
			this.container.attr("data-ss-state", "ready");
		else
			this.container.attr("data-ss-state", (fast) ? "intransit-fast" : "intransit");
	
		if (this.infinite) {
			var duration = parseFloat(this.container.css("transition-duration").replace(/s$/,"")) * 1000;
			
			duration = (!duration) ? 850 : duration;
			
			// Slide Backward
			if (!jumping && this.index === this.numChildren - 2 && !this.forward) {
				this.infiniteID = window.setTimeout(function() {
					self.container.attr("data-ss-state", "notransition");
					self.offset = -self.index*self.itemWidth + self.peekWidth/2;
					setTranslate(self.container[0], self.offset);
					window.setTimeout(function() {
						self.container.attr("data-ss-state", "ready");
						self.ready = true;
					}, 0);
				}, duration);
			}
			// Slide Forward
			else if (!jumping && this.index === 1 && this.forward) {
				this.infiniteID = window.setTimeout(function() {
					self.container.attr("data-ss-state", "notransition");
					self.offset = -self.itemWidth + self.peekWidth/2;
					setTranslate(self.container[0], self.offset);
					window.setTimeout(function() {
						self.container.attr("data-ss-state", "ready");
						self.ready = true;
					}, 0);
				}, duration);
			}
			else
				this.infiniteID = undefined;
		}
		
		if (self.interrupted)
			this.container.on(TRANSITION_END, function() {
				self.interrupted = false;
			});
		
		if (self.autoscroll && self.autoscrollRestartID === undefined)
			this.container.on(TRANSITION_END, function() {
					self.autoscrollRestartID = window.setTimeout(function() {
						self.autoscrollOn();
					}, 1000);
			});
	};
	
	Carousel.prototype.slideForward = function(fast) {
		if (!this.ready || (!this.infinite && this.index === this.numChildren - 1) || this.isZooming) return false;
		
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
		this.forward = true;
		this.gotoPos(this.offset - this.itemWidth, fast);
		
		return true;
	};
	
	Carousel.prototype.slideBackward = function(fast) {
		if (!this.ready || (!this.infinite && this.index === 0) || this.isZooming) return false;
		
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
		this.forward = false;
		this.gotoPos(this.offset + this.itemWidth, fast);
		
		return true;
	};
	
	Carousel.prototype.adjustSize = function() {
		if (this.fullscreen) {
			var diff = this.widget.width() - this.itemWidth;
			var prevState = this.container.attr("data-ss-state");
			var self = this;
			this.itemWidth -= this.peekWidth;
			this.itemWidth += diff;
			this.offset = -this.index * this.itemWidth + this.peekWidth/2;
			this.container.attr("data-ss-state", "notransition");
			setTranslate(this.container[0], this.offset);			
			this.container.find("[data-ss-component='item']").width(this.itemWidth);
		}

		this.container.width(this.itemWidth * this.numChildren);
		
		if (this.zoom) {
			this.panMax.x = this.itemWidth / this.zoomMultiplier;	
			this.panMax.y = this.container.find("[data-ss-component]").height() / this.zoomMultiplier;
			this.checkPanLimits();
		}
	};
	
	Carousel.prototype.handleInterrupt = function(e) {
		if (this.isZooming || this.isZoomed || !this.swipe) {
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
		
		self.container.attr("data-ss-state", "notransition");
		
		// Forward Loop Interrupt
		if (this.infinite && this.index === 1 && this.forward) {
			window.clearInterval(self.infiniteID);
			self.offset = self.itemWidth*(self.numChildren - 2) + xcoord;
			setTranslate(self.container[0], self.offset);
		}
		// Backward Loop Interrupt
		else if (this.infinite && (this.index === this.numChildren - 2) && !this.forward) {
			window.clearInterval(self.infiniteID);
			self.offset = xcoord - self.itemWidth*(self.numChildren - 2);
			setTranslate(self.container[0], self.offset);
		}
		else
			setTranslate(this.container[0], xcoord);
		
		coords1 = soysauce.getCoords(e);
		
		this.widget.on("touchmove mousemove", function(e2) {
			if (self.isZoomed) {
				soysauce.stifle(e);
				soysauce.stifle(e2);
				return;
			}
			
			var dragOffset;
			ret = coords2 = soysauce.getCoords(e2);
			
			if (self.lockScroll === undefined) {
				if (Math.abs((coords1.y - coords2.y)/(coords1.x - coords2.x)) > 1.2)
					self.lockScroll = "y";
				else
					self.lockScroll = "x";
			}
			
			if (self.lockScroll === "y")
				return;
			
			soysauce.stifle(e2);
			dragOffset = coords1.x - coords2.x;
			
			if (self.infiniteID !== undefined)
				setTranslate(self.container[0], self.offset - dragOffset);
			else
				setTranslate(self.container[0], xcoord - dragOffset);
		});
		
		if (this.infiniteID !== undefined) this.widget.one("touchend mouseup", function(e2) {
			self.infiniteID = undefined;
			self.container.attr("data-ss-state", "intransit");
			
			if (self.index === self.numChildren - 2)
				self.offset = -self.index*self.itemWidth + self.peekWidth/2;
			else if (self.index === 1)
				self.offset = -self.itemWidth + self.peekWidth/2;
			
			window.setTimeout(function() {
				setTranslate(self.container[0], self.offset);
			}, 0);
		});
		
		return ret;
	};
	
	Carousel.prototype.handleSwipe = function(e1) {
		var self = this;
		var coords1, coords2, lastX, originalDist = 0, prevDist = -1;
		var newX2 = 0, newY2 = 0;
		var panLock = true, zoomingIn = null;
		
		if (this.infinite) {
			if (new Date().getTime() - this.lastSlideTime < 225) return;
			this.lastSlideTime = new Date().getTime();
		}
		
		coords1 = soysauce.getCoords(e1);
		
		this.coords1x = coords1.x;
		this.coords1y = coords1.y;
		
		if (coords1.y2 && coords1.x2) {
			var xs = 0, ys = 0, dist = 0;
			
			ys = (coords1.y2 - coords1.y)*(coords1.y2 - coords1.y);
			xs = (coords1.x2 - coords1.x)*(coords1.x2 - coords1.x);
			
			originalDist = Math.sqrt(ys + xs);
		}
		
		if (e1.type.match(/mousedown/) !== null) soysauce.stifle(e1); // for desktop debugging

		this.lockScroll = undefined;

		if (!this.ready) 
			lastX = this.handleInterrupt(e1);
		else {
			// Pan or Pinch Zooming
			if (this.zoom && this.isZoomed) {
				this.widget.one("touchend mouseup", function(e2) {
					var array = soysauce.getArrayFromMatrix($(e2.target).css("-webkit-transform"));
					var panX = parseInt(array[4]);
					var panY = parseInt(array[5]);
					self.panCoordsStart.x = (Math.abs(panX) > 0) ? panX : 0;
					self.panCoordsStart.y = (Math.abs(panY) > 0) ? panY : 0;
					panLock = true;
					zoomingIn = null;
					if ($(e2.target).attr("data-ss-state") === "panning")
						$(e2.target).attr("data-ss-state", "ready");
				});
				this.widget.on("touchmove mousemove", function(e2) {
					soysauce.stifle(e2);
					
					if (!/img/i.test(e2.target.tagName)) return;
					else if ($(e2.target).attr("data-ss-button-type") !== undefined || $(e2.target).attr("data-ss-component") === "dots") return;
					
					coords2 = soysauce.getCoords(e2);
					
					$(e2.target).attr("data-ss-state", "panning");
					
					if (self.pinch && coords2.x2 && coords2.y2) {
						panLock = false;
						newX2 = coords2.x2;
						newY2 = coords2.y2;
					}
					
					// Pinch Zooming
					if (!panLock && self.pinch) {
						var xs = 0, ys = 0, scale = 0, newDist = 0;
						
						ys = (newY2 - coords2.y)*(newY2 - coords2.y);
						xs = (newX2 - coords2.x)*(newX2 - coords2.x);
						
						newDist = Math.sqrt(ys + xs);
						
						if (originalDist === 0)
							originalDist = newDist;
						else if (zoomingIn === null || (zoomingIn === true && (newDist < prevDist) && prevDist !== -1) || (zoomingIn === false && (newDist > prevDist) && prevDist !== -1)) {
							originalDist = newDist;
							if (zoomingIn)
								zoomingIn = false;
							else
								zoomingIn = true;
						}
						prevDist = newDist;
						
						scale = (newDist - originalDist)/PINCH_SENSITIVITY;
						
						self.zoomMultiplier += scale;
						
						if (self.zoomMultiplier >= self.zoomMax)
							self.zoomMultiplier = self.zoomMax;
						else if (self.zoomMultiplier <= self.zoomMin)
							self.zoomMultiplier = self.zoomMin;
						
						self.panMax.x = (self.zoomMultiplier - 1) * self.panMaxOriginal.x;				
						self.panMax.y = (self.zoomMultiplier - 1) * self.panMaxOriginal.y;
						
						if (self.zoomMultiplier === self.zoomMax || self.zoomMultiplier === self.zoomMin) 
							return;
						
						self.checkPanLimits();

						self.panCoordsStart.x = self.panCoords.x;
						self.panCoordsStart.y = self.panCoords.y;
					}
					// Panning
					else {
						self.panCoords.x = self.panCoordsStart.x + coords2.x - self.coords1x;
						self.panCoords.y = self.panCoordsStart.y + coords2.y - self.coords1y;

						self.checkPanLimits();
					}
					
					setTranslate(e2.target, self.panCoords.x, self.panCoords.y);
					setScale(e2.target, self.zoomMultiplier);
				});
			}
			// Swipe Forward/Backward
			else if (this.swipe) this.widget.on("touchmove mousemove", function(e2) {
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
				
				soysauce.stifle(e2);
				self.panning = true;
				lastX = coords2.x;
				dragOffset = coords1.x - coords2.x;
				self.container.attr("data-ss-state", "notransition");
				setTranslate(self.container[0], self.offset - dragOffset);
			});
		}

		// Decides whether to zoom or move to next/prev item
		this.widget.one("touchend mouseup", function(e2) {
			soysauce.stifle(e2);
			
			var targetComponent = $(e2.target).attr("data-ss-component");
			
			if (targetComponent === "button")
				return;
			
			coords2 = soysauce.getCoords(e2);
			if (coords2 !== null) lastX = coords2.x;

			var xDist = self.coords1x - lastX;
			var yDist = self.coords1y - coords2.y;
			
			var time = Math.abs(e2.timeStamp - e1.timeStamp);
			
			var velocity = xDist / time;
			var fast = (velocity > 0.9) ? true : false;
			
			self.widget.off("touchmove mousemove");
			
			if (!self.interrupted && self.links && Math.abs(xDist) === 0) {
				self.ready = true;
				self.container.attr("data-ss-state", "ready");
				if (e2.target.tagName.match(/^a$/i) !== null)
					window.location.href = $(e2).attr("href");
				else if ($(e2.target).closest("a").length > 0)
					window.location.href = $(e2.target).closest("a").attr("href");
			}
			else if (!self.interrupted && self.zoom && ((Math.abs(xDist) < 2 && Math.abs(yDist) < 2) || self.isZoomed)) {
				soysauce.stifle(e1);
				self.toggleZoom(e1, e2, Math.abs(xDist), Math.abs(yDist));
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
	
	Carousel.prototype.checkPanLimits = function() {
		if (Math.abs(this.panCoords.x) > this.panMax.x && this.panCoords.x > 0)
			this.panCoords.x = this.panMax.x;
		else if (Math.abs(this.panCoords.x) > this.panMax.x && this.panCoords.x < 0)
			this.panCoords.x = -this.panMax.x;

		if (Math.abs(this.panCoords.y) > this.panMax.y && this.panCoords.y > 0)
			this.panCoords.y = this.panMax.y;
		else if (Math.abs(this.panCoords.y) > this.panMax.y && this.panCoords.y < 0)
			this.panCoords.y = -this.panMax.y;
			
		if (this.isZoomed) {
			var img = this.items[this.index];
			
			if (!/img/i.test(img.tagName))
				img = $(img).find("img")[0];
			
			$(img).attr("data-ss-state", "panning");
			setTranslate(img, this.panCoords.x, this.panCoords.y);
			setScale(img, this.zoomMultiplier);
		}
	};
	
	Carousel.prototype.toggleZoom = function(e1, e2, xDist, yDist) {
		if (!this.ready && !(this.isZoomed && xDist < 2 && yDist < 2) || (e1.type.match(/touch/) !== null && e2.type.match(/mouse/) !== null)) {
			soysauce.stifle(e1);
			soysauce.stifle(e2);
			return;
		}
		
		var zoomImg = this.items[this.index];
		zoomImg = (!/img/i.test(zoomImg.tagName)) ? $(zoomImg).find("img")[0] : zoomImg;
		
		var self = this;
		$(zoomImg).attr("data-ss-state", "ready");
		
		// Zoom In
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

				self.checkPanLimits();

				self.panCoordsStart.x = self.panCoords.x;
				self.panCoordsStart.y = self.panCoords.y;
			}
			
			if (!isNaN(self.panCoords.x) && !isNaN(self.panCoords.y)) {
				this.dots.first().parent().css("visibility", "hidden");
				this.nextBtn.hide();
				this.prevBtn.hide();
				this.isZooming = true;
				this.ready = false;
				this.widget.attr("data-ss-state", "zoomed");
				this.zoomIcon.attr("data-ss-state", "in");
				setTranslate(zoomImg, self.panCoords.x, self.panCoords.y);
				setScale(zoomImg, self.zoomMultiplier);
				$(zoomImg).on(TRANSITION_END, function() {
					self.isZoomed = true;
					self.isZooming = false;
				});
			}
		}
		// Zoom Out
		else if (xDist < 2 && yDist < 2) {
			this.dots.first().parent().css("visibility", "visible");
			this.nextBtn.show();
			this.prevBtn.show();
			this.isZooming = true;
			this.ready = false;
			this.widget.attr("data-ss-state", "ready");
			this.zoomIcon.attr("data-ss-state", "out");
			setTranslate(zoomImg, 0, 0);
			setScale(zoomImg, 1);
			$(zoomImg).on(TRANSITION_END, function() {
				self.isZoomed = false;
				self.isZooming = false;
			});
		}
		
		$(zoomImg).on(TRANSITION_END, function() {
			self.ready = true;
			self.interrupted = false;
			self.isZooming = false;
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
		var newCarousel = this.widget;
		carousels.forEach(function(e,i) {
			if (self.id === e.id)
				carousels.remove(i);
		});
		newCarousel.removeAttr("data-ss-state");
		callback();
		newCarousel.each(init);
		return true;
	};
	
	Carousel.prototype.handleFreeze = function() {
		this.freeze = true;
	};
	
	Carousel.prototype.handleUnfreeze = function() {
		this.freeze = false;
	};
	
	Carousel.prototype.jumpTo = function(index) {
		var self = this;
		
		if (index === this.index) return false;
		
		if (this.infinite) {
			if (index < 1 || index > this.maxIndex )
				return false;
		}
		else {
			if (index < 0 || index > this.maxIndex - 1)
				return false;
		}
		
		var newOffset = index * -this.itemWidth;
		
		if (this.infinite) {
			$(this.items[this.index]).attr("data-ss-state", "inactive");
			$(this.items[index]).attr("data-ss-state", "active");
			$(this.dots[this.index - 1]).attr("data-ss-state", "inactive");
			$(this.dots[index - 1]).attr("data-ss-state", "active");
		}
		else {
			$(this.items[this.index]).attr("data-ss-state", "inactive");
			$(this.items[index]).attr("data-ss-state", "active");
			$(this.dots[this.index]).attr("data-ss-state", "inactive");
			$(this.dots[index]).attr("data-ss-state", "active");
		}

		this.gotoPos(newOffset, false, true);
		this.index = index;
		
		return true;
	};
	
	// Helper Functions
	function setTranslate(element, x, y) {
		x = (!x) ? 0 : x;
		y =  (!y) ? 0 : y;
		element.style.webkitTransform = element.style.msTransform = element.style.OTransform = element.style.MozTransform = element.style.transform = "translate" + ((SUPPORTS3D) ? "3d(" + x + "px," + y + "px,0)": "(" + x + "px," + y + "px)");
	}
	
	function setScale(element, multiplier) {
		var currTransform = element.style.webkitTransform;
		multiplier = (!multiplier) ? ZOOM_MULTIPLIER : multiplier;
		element.style.webkitTransform = element.style.msTransform = element.style.OTransform = element.style.MozTransform = element.style.transform 
		= currTransform + " scale" + ((SUPPORTS3D) ? "3d(" + multiplier + "," + multiplier + ",1)" : "(" + multiplier + "," + multiplier + ")");
	}
	
	function init() {
		var carousel = new Carousel(this);
		var self = this;
		var options = soysauce.getOptions(this);
		var loadCounter = 1;
		var items;
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
				case "nofullscreen":
					carousel.fullscreen = false;
					break;
				case "noswipe":
					carousel.swipe = false;
					break;
				case "zoom":
					carousel.zoom = true;
					break;
				case "pinch":
					carousel.pinch = true;
					break
				case "3d":
					carousel.supports3d = true;
					break;
			}
		});
		
		if (carousel.cms) {
			var img_src = "";
			$(this).find("style").each(function(e) {
				var img = "";
			  img_src = $(this).html().match(/\/\/[\w_\.\/-]+-2x[\w\.\/]+/i)[0];
				img = "<img src='" + img_src + "'>"
				$(this).before(img);

				$(this).closest("li").attr("data-ss-component", "item")

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
			carousel.zoomMin = (!$(this).attr("data-ss-zoom-min")) ? 1.2 : parseFloat($(this).attr("data-ss-zoom-min"));
			carousel.zoomMax = (!$(this).attr("data-ss-zoom-max")) ? 4 : parseFloat($(this).attr("data-ss-zoom-max"));
			if (carousel.zoomMin < 1.2)
				carousel.zoomMin = 1.2;
			if (carousel.zoomMin > carousel.zoomMax)
				console.warn("Soysauce: zoomMin is greater than zoomMax, errors may occur.");
		}
		wrapper.after("<div data-ss-component='button' data-ss-button-type='prev' data-ss-state='disabled'></div><div data-ss-component='button' data-ss-button-type='next'></div>");
		wrapper.after("<div data-ss-component='dots'></div>")
		carousel.dots = $(this).find("[data-ss-component='dots']");
		
		carousel.nextBtn = wrapper.find("~ [data-ss-button-type='next']");
		carousel.prevBtn = wrapper.find("~ [data-ss-button-type='prev']");
		
		wrapper.find("~ [data-ss-button-type='prev']").click(function(e) {
			soysauce.stifle(e);
			if (carousel.ready && !carousel.interrupted && !carousel.freeze)
				carousel.slideBackward();
		});
		
		wrapper.find("~ [data-ss-button-type='next']").click(function(e) {
			soysauce.stifle(e);
			if (carousel.ready && !carousel.interrupted && !carousel.freeze)
				carousel.slideForward();
		});
		
		carousel.maxIndex = $(this).find("[data-ss-component='item']").length;
		
		if (carousel.infinite) {
			first_item = carousel.container.find("[data-ss-component='item']").first().clone();
			last_item = carousel.container.find("[data-ss-component='item']").last().clone();
			first_item.appendTo(carousel.container);
			last_item.prependTo(carousel.container);
			carousel.lastSlideTime = new Date().getTime();
		}
		
		carousel.items = items = $(this).find("[data-ss-component='item']");
		carousel.numChildren = items.length;
		
		if (!carousel.infinite)
			wrapper.find("~ [data-ss-button-type='next']").attr("data-ss-state", (carousel.numChildren > 1) ? "enabled" : "disabled");
		else
			wrapper.find("~ [data-ss-button-type='next']").attr("data-ss-state", "enabled");
		
		carousel.links = ((items[0].tagName.match(/^a$/i) !== null) || items.find("a[href]").length > 0) ? true : false;
		
		var dotsHtml = "";
		var numDots = (carousel.infinite) ? carousel.numChildren - 2 : carousel.numChildren;
		for (i = 0; i < numDots; i++) {
			dotsHtml += "<div data-ss-component='dot'></div>";
		}
		carousel.dots.html(dotsHtml);
		carousel.dots = carousel.dots.find("div");
		carousel.dots.attr("data-ss-state", "inactive")
		carousel.dots.first().attr("data-ss-state", "active");
		carousel.dots.on("click", function(e) {
			if (!carousel.ready || carousel.interrupted || carousel.freeze) return;
			
			soysauce.stifle(e);
			
			var index = carousel.dots.index(this);
			
			if (carousel.infinite) {
				index += 1;
			}
			
			carousel.ready = false;
			carousel.jumpTo(index);
		});
		
		if (carousel.peek) {
			carousel.peekWidth = (!$(this).attr("data-ss-peek-width")) ? PEEK_WIDTH : parseInt($(this).attr("data-ss-peek-width"));
			if (carousel.peekWidth % 2) $(this).attr("data-ss-peek-width", ++carousel.peekWidth);
		}
		
		items.attr("data-ss-state", "inactive");
		if (carousel.infinite) {
			$(items[1]).attr("data-ss-state", "active");
			carousel.index++;
		}
		
		carousel.container.imagesLoaded(function(items) {
			carousel.itemWidth = $(self).width();

			carousel.container.width(carousel.itemWidth * (carousel.numChildren));
			
			if (carousel.peek) {
				carousel.itemWidth -= carousel.peekWidth;
				carousel.offset += carousel.peekWidth/2;
			}
			
			carousel.items.width(carousel.itemWidth);
			
			if (carousel.infinite) 
				carousel.gotoPos(-carousel.itemWidth + carousel.offset);							
			else
				carousel.gotoPos(carousel.offset);

			if (carousel.zoom) {
				var zoomMultiplier = $(this).attr("data-ss-zoom-multiplier");
				carousel.zoomMultiplier = (!zoomMultiplier) ? ZOOM_MULTIPLIER : parseInt(zoomMultiplier);
				carousel.panMax.x = (carousel.itemWidth - carousel.peekWidth) / carousel.zoomMultiplier;				
				carousel.panMax.y = $(self).find("[data-ss-component='item']").height() / carousel.zoomMultiplier;
				carousel.panMaxOriginal.x = carousel.panMax.x;
				carousel.panMaxOriginal.y = carousel.panMax.y;
				if (carousel.panMax.y === 0) {
					var imageToLoad = $(self).find("img")[0];
					$(imageToLoad).load(function() {
						carousel.panMax.y = imageToLoad.height / carousel.zoomMultiplier;
						carousel.panMaxOriginal.y = carousel.panMax.y;
					});
				}
			}
			$(self).trigger("SSWidgetReady").attr("data-ss-state", "ready");
		});
		
		if (carousel.fullscreen) $(window).on("resize orientationchange", function() {
			carousel.adjustSize();
		});
		
		if (carousel.swipe || carousel.zoom) carousel.widget.on("touchstart mousedown", function(e) {
			var targetComponent = $(e.target).attr("data-ss-component");
			
			if ((targetComponent === "zoom_icon" || targetComponent === "dot") && self.interrupted) {
				var currXPos = parseInt(soysauce.getArrayFromMatrix(self.container.css("-webkit-transform"))[4]);
				if (currXPos === carousel.offset) {
					carousel.interrupted = false;
				}
			}
			
			if (carousel.freeze || targetComponent === "button" || targetComponent === "zoom_icon" || targetComponent === "dot" || targetComponent === "dots")
				return;
			
			carousel.handleSwipe(e);
		});
		
		carousel.ready = true;
		carousel.container.on(TRANSITION_END, function() {
			carousel.ready = true;
			carousel.container.attr("data-ss-state", "ready");
		});
		
		if (carousel.autoscroll) {
			var interval = $(this).attr("data-ss-autoscroll-interval");
			carousel.autoscrollInterval = (!interval) ? AUTOSCROLL_INTERVAL : parseInt(interval);
			carousel.autoscrollOn();
		}
		
		carousels.push(carousel);
	}
	
	// Init
	$("[data-ss-widget='carousel']").each(init);
	
	return carousels;
})();
