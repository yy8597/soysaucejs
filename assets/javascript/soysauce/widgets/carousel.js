soysauce.carousels = (function() {
	// Shared Default Globals
	var AUTOSCROLL_INTERVAL = 5000;
	var ZOOM_MULTIPLIER = 2;
	var PEEK_WIDTH = 20;
	var TRANSITION_END = "transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd";
	var PINCH_SENSITIVITY = 1500; // lower to increase sensitivity for pinch zoom
	var PREFIX = soysauce.getPrefix();
	
	function Carousel(selector) {
		var options = soysauce.getOptions(selector);
		var self = this;
		var wrapper;
		var dotsHtml = "";
		var numDots;
		var thumbnails;
		
		// Base Variables
		this.widget = $(selector);
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
		this.jumping = false;
		
		// Infinite Variables
		this.infinite = true;
		this.autoscroll = false;
		this.autoscrollID;
		this.autoscrollInterval;
		this.autoscrollRestartID;
		this.infiniteID;
		this.forward;
		this.lastSlideTime;
		this.cloneDepth = 0;
		this.looping = false;
		this.rewindCoord = 0;
		
		// Fullscreen & Peek Variables
		this.fullscreen = true;
		this.peek = false;
		this.peekWidth = 0;
		this.peekAlign;
		
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
		
		// Thumbnail Variables
		this.thumbs = false;
		
		// Multi Item Variables
		this.multi = false;
		this.multiVars = {
			numItems: 2,
			stepSize: 1,
			minWidth: 0
		};
		
		// Autoheight Variables
		this.autoheight = false;
		
		// Fade Variables
		this.fade = false;
		
		if (options) options.forEach(function(option) {
			switch(option) {
				case "cms":
					self.cms = true;
					break;
				case "peek":
					self.peek = true;
					break;
				case "finite":
					self.infinite = false;
					break;
				case "autoscroll":
					self.autoscroll = true;
					break;
				case "nofullscreen":
					self.fullscreen = false;
					break;
				case "noswipe":
					self.swipe = false;
					break;
				case "zoom":
					self.zoom = true;
					break;
				case "pinch":
					self.pinch = true;
					break
				case "thumbs":
					self.thumbs = true;
					break;
				case "multi":
					self.multi = true;
					break;
				case "autoheight":
					self.autoheight = true;
					break;
				case "fade":
					self.fade = true;
					break;
			}
		});

		if (this.cms) {
			var img_src = "";
			this.widget.find("style").each(function(e) {
				var styleTag = $(this);
				var img = "";
				img_src = styleTag.html().match(/\/\/[\w_\.\/-]+-2x[\w\.\/]+/i)[0];
				img = "<img src='" + img_src + "'>"
				styleTag.before(img);

				styleTag.closest("li").attr("data-ss-component", "item")

				styleTag.find("+ *").remove();
				styleTag.remove();
			});
		}
		
		if (this.swipe) this.widget.find("a").click(function(e) {
			soysauce.stifle(e);
		});
		
		this.widget.wrapInner("<div data-ss-component='container' />");
		this.widget.wrapInner("<div data-ss-component='container_wrapper' />");
		this.container = this.widget.find("[data-ss-component='container']");
		
		wrapper = this.widget.find("[data-ss-component='container_wrapper']");
		
		if (this.zoom) {
			wrapper.after("<div data-ss-component='zoom_icon' data-ss-state='out'></div>");
			this.zoomIcon = wrapper.find("~ [data-ss-component='zoom_icon']");
			this.zoomMin = parseFloat(this.widget.attr("data-ss-zoom-min")) || 1.2;
			this.zoomMax = parseFloat(this.widget.attr("data-ss-zoom-max")) || 4;
			
			if (this.zoomMin < 1.2) {
				this.zoomMin = 1.2;
			}
			
			if (this.zoomMin > this.zoomMax) {
				console.warn("Soysauce: zoomMin is greater than zoomMax, errors may occur.");
			}
		}
		
		if (this.infinite) {
			wrapper.after("<div data-ss-component='button' data-ss-button-type='prev' data-ss-state='enabled'></div><div data-ss-component='button' data-ss-button-type='next'></div>");
		}
		else {
			wrapper.after("<div data-ss-component='button' data-ss-button-type='prev' data-ss-state='disabled'></div><div data-ss-component='button' data-ss-button-type='next'></div>");
		}
		wrapper.after("<div data-ss-component='dots'></div>")
		this.dots = this.widget.find("[data-ss-component='dots']");

		this.nextBtn = wrapper.find("~ [data-ss-button-type='next']");
		this.prevBtn = wrapper.find("~ [data-ss-button-type='prev']");

		wrapper.find("~ [data-ss-button-type='prev']").click(function(e) {
			soysauce.stifle(e);
			if (self.ready && !self.interrupted && !self.freeze) {
				self.slideBackward();
			}
		});

		wrapper.find("~ [data-ss-button-type='next']").click(function(e) {
			soysauce.stifle(e);
			if (self.ready && !self.interrupted && !self.freeze) {
				self.slideForward();
			}
		});

		this.maxIndex = this.widget.find("[data-ss-component='item']").length;
		
		if (this.multi) {
			var numItems = parseInt(this.widget.attr("data-ss-multi-set"));
			var minWidth = parseInt(this.widget.attr("data-ss-multi-min-width"));
			this.multiVars.numItems = numItems || 2;
			this.multiVars.minWidth = minWidth || 0;
		}
		
		if (this.infinite) {
			if (this.multi) {
				// createClones(this, this.multiVars.numItems);
				console.warn("Soysauce: 'multi' option with infinite scrolling not yet supported. Please add 'finite' option.")
				createClones(this, 1);
			}
			else {
				createClones(this, 1);
			}
			this.lastSlideTime = new Date().getTime();
		}

		this.items = items = this.widget.find("[data-ss-component='item']");
		
		if (items.length === 0) {
			console.warn("Soysauce: No [data-ss-component='item'] attributes found with widget id " + this.id);
			return;
		}
		
		this.numChildren = items.length;

		if (!this.infinite) {
			wrapper.find("~ [data-ss-button-type='next']").attr("data-ss-state", (this.numChildren > 1) ? "enabled" : "disabled");
		}
		else {
			wrapper.find("~ [data-ss-button-type='next']").attr("data-ss-state", "enabled");
		}
		
		this.links = (!items[0].tagName.match(/^a$/i) && !items.find("a[href]").length) ? false : true;

		if (this.thumbs) {
			var c = 0;

			if (this.container.find("[data-ss-component='thumbnail']").length > 0) return;

			this.items.each(function(i, item){ 
				var src = (/img/i.test(item.tagName)) ? $(this).attr("src") : $(this).find("img").attr("src");
				
				++c;

				// Skip first and last, as they are clones.
				if (self.infinite && (c === 1 || c === self.numChildren)) {
					return; 
				}

				self.container.append("<img data-ss-component='thumbnail' src='" + src + "'>");
			});
		}

		numDots = (this.infinite) ? this.numChildren - 2 : this.numChildren;
		thumbnails = this.container.find("[data-ss-component='thumbnail']");

		if (thumbnails.length > 0) {
			thumbnails.each(function(i, thumbnail) {
				dotsHtml += "<div data-ss-component='dot'>" + thumbnail.outerHTML + "</div>";
				$(this).remove();
			});
		}
		else {
			for (i = 0; i < numDots; i++) {
				dotsHtml += "<div data-ss-component='dot'></div>";
			}
		}
		
		this.dots.html(dotsHtml);
		this.dots = this.dots.find("div");
		this.dots.attr("data-ss-state", "inactive")
		this.dots.first().attr("data-ss-state", "active");
		this.dots.on("click", function(e) {
			var currXPos = parseInt(soysauce.getArrayFromMatrix(self.container.css(PREFIX + "transform"))[4]);
			var index = 0;
			
			if (currXPos === self.offset) {
				self.ready = true;
			}

			if (!self.ready || self.interrupted || self.freeze) return;

			soysauce.stifle(e);

			index = self.dots.index(this);

			if (self.infinite) {
				index += 1;
			}
			
			self.jumpTo(index);
		});

		if (this.peek) {
			this.peekAlign = this.widget.attr("data-ss-peek-align") || "center";
			this.peekWidth = parseInt(this.widget.attr("data-ss-peek-width")) || PEEK_WIDTH;
			if (this.peekWidth % 2) {
				this.widget.attr("data-ss-peek-width", ++this.peekWidth);
			}
		}

		items.attr("data-ss-state", "inactive");
		
		if (this.infinite) {
			$(items[1]).attr("data-ss-state", "active");
			this.index++;
		}
		else {
			$(items[0]).attr("data-ss-state", "active");
		}
		
		this.container.imagesLoaded(function(items) {
			var firstItem = self.items.first();
			var margin = parseInt(firstItem.css("margin-left")) + parseInt(firstItem.css("margin-right"));
			
			if (self.multi) {
				var widgetWidth = self.widget.find('[data-ss-component="container_wrapper"]').innerWidth();
				if (self.multiVars.minWidth > 0) {
					self.multiVars.numItems = Math.floor(widgetWidth / self.multiVars.minWidth);
				}
				self.itemWidth = widgetWidth / self.multiVars.numItems;
			}
			else {
				self.itemWidth = self.widget.outerWidth();
			}
			
			if (self.peek) {
				self.itemWidth -= self.peekWidth*2;
				switch (self.peekAlign) {
					case "center":
						self.offset += self.peekWidth;
						break;
					case "left": // TBI
						break;
					case "right": // TBI
						break;
				}
			}
			
			if (!self.fade) {
				self.container.width((self.itemWidth + margin) * self.numChildren);
				self.items.css("width", self.itemWidth + "px");
			}
		
			if (self.infinite) {
				self.offset -= self.itemWidth;
			}
			
			self.container.attr("data-ss-state", "notransition");
			setTranslate(self.container[0], self.offset);

			if (self.zoom) {
				self.initPanLimits();
			}
		});

		if (this.swipe || this.zoom) this.widget.on("touchstart mousedown", function(e) {
			var targetComponent = $(e.target).attr("data-ss-component");

			if ((targetComponent === "zoom_icon" || targetComponent === "dot" || targetComponent === "thumbnail") && self.interrupted) {
				var currXPos = (soysauce.vars.degrade) ? parseInt(self.container[0].style.left) : parseInt(soysauce.getArrayFromMatrix(self.container.css(PREFIX + "transform"))[4]);
				if (currXPos === self.offset) {
					self.interrupted = false;
				}
			}

			if (self.jumping || self.freeze || targetComponent === "button" ||
			 		targetComponent === "dot" || targetComponent === "dots" || 
					targetComponent === "thumbnail") {
				return;
			}

			self.handleSwipe(e);
		});

		this.container.on(TRANSITION_END, function() {
			self.widget.trigger("slideEnd");
			self.ready = true;
			self.jumping = false;
			self.interrupted = false;
			self.container.attr("data-ss-state", "ready");

			if (self.autoscroll && self.autoscrollRestartID === undefined) {
				self.autoscrollRestartID = window.setTimeout(function() {
					self.autoscrollOn();
				}, 1000);
			}
		});
		
		if (this.autoscroll) {
			var interval = this.widget.attr("data-ss-autoscroll-interval");
			this.autoscrollInterval = (!interval) ? AUTOSCROLL_INTERVAL : parseInt(interval);
			this.autoscrollOn();
		}
		
		if (this.autoheight) {
			var height = $(this.items[this.index]).outerHeight();
			this.widget.css("min-height", height);
		}
		
		this.widget.one("SSWidgetReady", function() {
			self.widget.attr("data-ss-state", "ready");
			self.ready = true;
			$(window).load(function() {
			  self.handleResize();
			});
			window.setTimeout(function() {
				self.container.attr("data-ss-state", "ready");
			}, 0);
			if (self.autoheight) {
				var height = $(self.items[self.index]).outerHeight();
				self.widget.css("height", height);
				window.setTimeout(function() {
					self.widget.css("min-height", "0px");
				}, 300);
			}
		});
	} // End Constructor
	
	Carousel.prototype.gotoPos = function(x, fast, jumping, resettingPosition) {
		var self = this;

		this.offset = x;
		setTranslate(this.container[0], x);
		
		if (this.ready) {
			this.container.attr("data-ss-state", "ready");
		}
		else {
			this.container.attr("data-ss-state", (fast) ? "intransit-fast" : "intransit");
		}
		
		if (self.autoscroll) {
			self.autoscrollOff();
			if (self.autoscrollRestartID !== undefined) {
				window.clearInterval(self.autoscrollRestartID);
				self.autoscrollRestartID = undefined;
			}
		}
		
		if (this.infinite) {
			var duration = 0, xcoord = 0;
			
			duration = parseFloat(this.container.css(PREFIX + "transition-duration").replace(/s$/,"")) * 1000;
			
			duration = (!duration) ? 650 : duration;
			// Slide Backward Rewind
			if (!resettingPosition && !jumping && this.index === this.numChildren - 2 && !this.forward) {
				this.infiniteID = window.setTimeout(function() {
					xcoord = (soysauce.vars.degrade) ? self.rewindCoord : parseInt(soysauce.getArrayFromMatrix(self.container.css(PREFIX + "transform"))[4]);
					self.container.attr("data-ss-state", "notransition");
					self.offset = xcoord - self.itemWidth*(self.numChildren - 2);
					setTranslate(self.container[0], self.offset);
					window.setTimeout(function() {
						self.container.attr("data-ss-state", "intransit");
						self.offset = -self.index*self.itemWidth + self.peekWidth;
						setTranslate(self.container[0], self.offset);
					}, 0);
				}, 0);
			}
			// Slide Forward Rewind
			else if (!resettingPosition && !jumping && this.index === 1 && this.forward) {
				this.infiniteID = window.setTimeout(function() {
					xcoord = (soysauce.vars.degrade) ? self.rewindCoord : parseInt(soysauce.getArrayFromMatrix(self.container.css(PREFIX + "transform"))[4]);
					self.container.attr("data-ss-state", "notransition");
					self.offset = self.itemWidth*(self.numChildren - 2) + xcoord;
					setTranslate(self.container[0], self.offset);
					window.setTimeout(function() {
						self.container.attr("data-ss-state", "intransit");
						self.offset = -self.itemWidth + self.peekWidth;
						setTranslate(self.container[0], self.offset);
					}, 0);
				}, 0);
			}
			else {
				this.infiniteID = undefined;
			}
		}
	};
	
	Carousel.prototype.slideForward = function(fast) {
		var self = this;
		
		if (!this.ready || 
			(!this.infinite && this.index === this.numChildren - 1) ||
			this.isZooming) return false;
		
		if (this.infinite) {
		  $(this.dots[this.index - 1]).attr("data-ss-state", "inactive");
		}
		else {
		  $(this.dots[this.index]).attr("data-ss-state", "inactive");
		}
			
		$(this.items[this.index++]).attr("data-ss-state", "inactive");
		
		if (this.infinite && this.index === this.numChildren - 1) {
			$(this.items[1]).attr("data-ss-state", "active");
			this.index = 1;
		}
		else {
		  $(this.items[this.index]).attr("data-ss-state", "active");
		}
		
		if (this.infinite) {
		  $(this.dots[this.index - 1]).attr("data-ss-state", "active");
		}
		else {
			$(this.dots[this.index]).attr("data-ss-state", "active");
			if (this.index === this.numChildren - 1) {
			  this.nextBtn.attr("data-ss-state", "disabled");
			}
			if (this.numChildren > 1) {
			  this.prevBtn.attr("data-ss-state", "enabled");
			}
		}
			
		this.ready = false;
		this.forward = true;
		this.gotoPos(this.offset - this.itemWidth, fast);
		
		return true;
	};
	
	Carousel.prototype.slideBackward = function(fast) {
		if (!this.ready || (!this.infinite && this.index === 0) || this.isZooming) return false;
		
		if (this.infinite) {
		  $(this.dots[this.index - 1]).attr("data-ss-state", "inactive");
		}
		else {
		  $(this.dots[this.index]).attr("data-ss-state", "inactive");
		}
			
		$(this.items[this.index--]).attr("data-ss-state", "inactive");
		
		if (this.infinite && this.index === 0) {
			$(this.items[this.numChildren - 2]).attr("data-ss-state", "active");
			this.index = this.numChildren - 2;
		}
		else {
		  $(this.items[this.index]).attr("data-ss-state", "active");
		}
		
		if (this.infinite) {
		  $(this.dots[this.index - 1]).attr("data-ss-state", "active");
		}
		else {
			$(this.dots[this.index]).attr("data-ss-state", "active");
			if (this.index === 0) {
			  this.prevBtn.attr("data-ss-state", "disabled");
			}
			if (this.numChildren > 1) {
			  this.nextBtn.attr("data-ss-state", "enabled");
			}
		}
			
		this.ready = false;
		this.forward = false;
		this.gotoPos(this.offset + this.itemWidth, fast);
		
		return true;
	};
	
	Carousel.prototype.initPanLimits = function() {
	  var zoomMultiplier = this.widget.attr("data-ss-zoom-multiplier"),
	      padding = parseInt(this.items.first().css("padding-left")) + parseInt(this.items.first().css("padding-right")),
	      self = this;
	      
		this.zoomMultiplier = parseInt(zoomMultiplier) || ZOOM_MULTIPLIER;
		this.panMaxOriginal.x = this.panMax.x = ((this.itemWidth - this.peekWidth*2) / this.zoomMultiplier) - padding;				
		this.panMaxOriginal.y = this.panMax.y = this.items.first().height() / this.zoomMultiplier;

		if (this.panMax.y === 0) {
			this.container.imagesLoaded(function() {
				self.panMax.y = self.items.last().height / self.zoomMultiplier;
				self.panMaxOriginal.y = self.panMax.y;
			});
		}
	};
	
	Carousel.prototype.handleResize = function() {
	  var widgetWidth = this.widget.find('[data-ss-component="container_wrapper"]').innerWidth(),
	      parentWidgetContainer;
	  
	  // Assumption: parent is a toggler
	  if (!widgetWidth) parentWidgetContainer = this.widget.parents().closest("[data-ss-widget='toggler'] [data-ss-component='content']");
	  
    if (parentWidgetContainer) {
      parentWidgetContainer.css("display", "block");
      widgetWidth = widgetWidth || parentWidgetContainer.outerWidth();
    }
	  
    if (this.fade) {
      return;
    }

    if (this.multi) {
      if (this.multiVars.minWidth) {
        this.multiVars.numItems = Math.floor(widgetWidth / this.multiVars.minWidth)
      }
      this.itemWidth = widgetWidth / this.multiVars.numItems;
    }

    if (this.fullscreen) {
      var diff;
      var prevState = this.container.attr("data-ss-state");

      if (this.multi) {
        diff = widgetWidth - (this.itemWidth * this.multiVars.numItems);
      }
      else {
        diff = widgetWidth - this.itemWidth;
      }

      if (this.peek) {
        this.itemWidth -= this.peekWidth*2;
        this.checkPanLimits();
      }

      this.itemWidth += diff;

      this.offset = -this.index * this.itemWidth + this.peekWidth;
      this.container.attr("data-ss-state", "notransition");

      this.items.css("width", this.itemWidth + "px");

      setTranslate(this.container[0], this.offset);
    }

    this.container.css("width", (this.itemWidth * this.numChildren) + "px");

    if (this.zoom) {
      this.panMax.x = this.itemWidth / this.zoomMultiplier;	
      this.panMax.y = this.container.find("[data-ss-component]").height() / this.zoomMultiplier;
      this.initPanLimits();
    }
	};
	
	Carousel.prototype.handleInterrupt = function(e) {
		if (this.isZooming || this.isZoomed || !this.swipe) {
			soysauce.stifle(e);
			return;
		}
		
		var self = this;
		var coords1, coords2, ret;
		var xcoord = (soysauce.vars.degrade) ? parseInt(self.container[0].style.left) : parseInt(soysauce.getArrayFromMatrix(this.container.css(PREFIX + "transform"))[4]);
		
		this.interrupted = true;
		
		if (this.autoscroll) {
			this.autoscrollOff();
			if (this.autoscrollRestartID !== undefined) {
				window.clearInterval(self.autoscrollRestartID);
				self.autoscrollRestartID = undefined;
			}
		}
		
		self.container.attr("data-ss-state", "notransition");
		
		// Loop Interrupt
		if ((this.infinite && this.index === 1 && this.forward) || (this.infinite && (this.index === this.numChildren - 2) && !this.forward)) {
			this.looping = true;
		}
		else {
			this.looping = false;
		}
		
		window.clearInterval(this.infiniteID);
		setTranslate(this.container[0], xcoord);
		
		coords1 = soysauce.getCoords(e);
		
		this.widget.on("touchmove mousemove", function(e2) {
			var dragOffset;
			
			if (self.isZoomed) {
				soysauce.stifle(e);
				soysauce.stifle(e2);
				return;
			}
			
			ret = coords2 = soysauce.getCoords(e2);
			
			if (self.lockScroll === undefined) {
				if (Math.abs((coords1.y - coords2.y)/(coords1.x - coords2.x)) > 1.2) {
					self.lockScroll = "y";
				}
				else {
					self.lockScroll = "x";
				}
			}
			
			if (self.lockScroll === "y") {
				return;
			}
			
			soysauce.stifle(e2);
			dragOffset = coords1.x - coords2.x;
			
			setTranslate(self.container[0], xcoord - dragOffset);
		});
		
		if (this.infiniteID !== undefined) this.widget.one("touchend mouseup", function(e2) {
			self.infiniteID = undefined;
			
			if (self.index === self.numChildren - 2) {
				self.offset = -self.index*self.itemWidth + (self.peekWidth);
			}
			else if (self.index === 1) {
				self.offset = -self.itemWidth + (self.peekWidth);
			}
			
			window.setTimeout(function() {
				self.container.attr("data-ss-state", "intransit");
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
					var array = soysauce.getArrayFromMatrix($(e2.target).css(PREFIX + "transform"));
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
						
						if (originalDist === 0) {
							originalDist = newDist;
						}
						else if (zoomingIn === null || 
										(zoomingIn === true && (newDist < prevDist) && prevDist !== -1) || 
										(zoomingIn === false && (newDist > prevDist) && prevDist !== -1)) {
							originalDist = newDist;
							zoomingIn = (zoomingIn) ? false : true;
						}
						
						prevDist = newDist;
						
						scale = (newDist - originalDist)/PINCH_SENSITIVITY;
						
						self.zoomMultiplier += scale;
						self.zoomMultiplier = (self.zoomMultiplier >= self.zoomMax) ? self.zoomMax : self.zoomMin;
						
						self.panMax.x = (self.zoomMultiplier - 1) * self.panMaxOriginal.x;				
						self.panMax.y = (self.zoomMultiplier - 1) * self.panMaxOriginal.y;
						
						if (self.zoomMultiplier === self.zoomMax || self.zoomMultiplier === self.zoomMin) {
							return;
						}
							
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
				
				if ($(e2.target).attr("data-ss-component") === "zoom_icon") return;
				
				if (self.lockScroll === undefined) {
					if (Math.abs((coords1.y - coords2.y)/(coords1.x - coords2.x)) > 1.2) {
						self.lockScroll = "y";
					}
					else {
						self.lockScroll = "x";
					}
				}
				
				if (self.lockScroll === "y") {
					return;
				}
				
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
			var forceZoom;
			var targetComponent = $(e2.target).attr("data-ss-component");
			
			if (self.jumping) return;
			
			soysauce.stifle(e2);
			
			if (targetComponent === "button") {
				return;
			}
			
			forceZoom = (targetComponent === "zoom_icon") ? true : false;
			
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
				
				if (e2.target.tagName.match(/^a$/i) !== null) {
					window.location.href = $(e2.target).attr("href");
				}
				else if ($(e2.target).closest("a").length > 0) {
					window.location.href = $(e2.target).closest("a").attr("href");
				}
				
			}
			else if (!self.interrupted && self.zoom && ((Math.abs(xDist) < 2 && Math.abs(yDist) < 2) || self.isZoomed || forceZoom)) {
				soysauce.stifle(e1);
				self.toggleZoom(e1, e2, Math.abs(xDist), Math.abs(yDist));
			}
			else if (Math.abs(xDist) < 15 || (self.interrupted && Math.abs(xDist) < 25)) {
				if (self.looping) return;
				soysauce.stifle(e1);
				self.ready = true;
				self.container.attr("data-ss-state", "ready");
				self.gotoPos(self.offset, true, false, true);
			}
			else if (Math.abs(xDist) > 3 && self.swipe) {
				self.ready = true;
				self.container.attr("data-ss-state", "ready");

				if (self.lockScroll === "y") {
					return;
				}
				
				if (xDist > 0) {
					if (!self.infinite && self.index === self.numChildren - 1 ||
						(self.multi && !self.infinite && self.index === self.numChildren - self.multiVars.numItems)) {
						self.gotoPos(self.index * -self.itemWidth + self.peekWidth);
					}
					else {
						if (soysauce.vars.degrade) {
							self.rewindCoord = parseInt(self.container.css("left"));
						}
						self.slideForward(fast);
					}
				}
				else {
					if (!self.infinite && self.index === 0) {
						self.gotoPos(self.peekWidth);
					}
					else {
						if (soysauce.vars.degrade) {
							self.rewindCoord = parseInt(self.container.css("left"));
						}
						self.slideBackward(fast);
					}
				}
			}
		});
	};
	
	Carousel.prototype.checkPanLimits = function() {
		if (Math.abs(this.panCoords.x) > this.panMax.x && this.panCoords.x > 0) {
			this.panCoords.x = this.panMax.x;
		}
		else if (Math.abs(this.panCoords.x) > this.panMax.x && this.panCoords.x < 0) {
			this.panCoords.x = -this.panMax.x;
		}

		if (Math.abs(this.panCoords.y) > this.panMax.y && this.panCoords.y > 0) {
			this.panCoords.y = this.panMax.y;
		}
		else if (Math.abs(this.panCoords.y) > this.panMax.y && this.panCoords.y < 0) {
			this.panCoords.y = -this.panMax.y;
		}
			
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
					if (e1.originalEvent !== undefined) {
						offset = e1.originalEvent.offsetY;
					}
					else {
						offset = e1.offsetY;
					}
				}
				else {
					if (e1.originalEvent !== undefined) {
						offset = e1.originalEvent.pageY - $(e1.target).offset().top;
					} 
					else {
						offset = e1.pageY - $(e1.target).offset().top;
					}
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
		
		if (!this.autoscrollID) {
			this.autoscrollID = window.setInterval(function() {
				if (soysauce.vars.degrade) {
					self.rewindCoord = -self.itemWidth*3 - self.peekWidth;
				}
				self.slideForward();
			}, self.autoscrollInterval);
			return true;
		}
		
		return false;
	};
	
	Carousel.prototype.autoscrollOff = function() {
		var self = this;
		
		if (!this.autoscrollID) return false;
		
		window.clearInterval(self.autoscrollID);
		this.autoscrollID = undefined;
		
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
		
		this.jumping = true;
		this.ready = false;
		
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

		if (this.fade) {
			this.index = index;
			return true;
		}

		if (this.autoheight) {
			var newHeight = $(self.items[index]).outerHeight();
			this.widget.height(newHeight);
		}

		if (this.isZoomed) {
			var zoomImg = this.items[this.index];
			zoomImg = (!/img/i.test(zoomImg.tagName)) ? $(zoomImg).find("img")[0] : zoomImg;
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

		this.gotoPos(newOffset, false, true);
		this.index = index;
		
		return true;
	};
	
	// Helper Functions
	function setTranslate(element, x, y) {
		x = x || 0;
		y = y || 0;
		if (soysauce.vars.degrade) {
			element.style.left = x + "px";
		}
		else {
			element.style.webkitTransform = 
			element.style.msTransform = 
			element.style.OTransform = 
			element.style.MozTransform = 
			element.style.transform =
				"translate3d(" + x + "px," + y + "px,0)";
		}
	}
	
	function setScale(element, multiplier) {
		var currTransform = element.style.webkitTransform;
		multiplier = (!multiplier) ? ZOOM_MULTIPLIER : multiplier;
		element.style.webkitTransform = 
		element.style.msTransform = 
		element.style.OTransform = 
		element.style.MozTransform = 
		element.style.transform = 
			currTransform + " scale" + ((!soysauce.vars.degrade) ? "3d(" + multiplier + "," + multiplier + ",1)" : "(" + multiplier + "," + multiplier + ")");
	}
	
	function createClones(carousel, cloneDepth) {
		var items = carousel.container.find("[data-ss-component='item']");
		var cloneSet1, cloneSet2;
		
		if (cloneDepth > carousel.maxIndex) return;
		
		carousel.cloneDepth = cloneDepth;
		
		cloneSet1 = items.slice(0, cloneDepth).clone();
		cloneSet2 = items.slice(carousel.maxIndex - cloneDepth, carousel.maxIndex).clone();

		cloneSet1.appendTo(carousel.container);
		cloneSet2.prependTo(carousel.container);
	}
	
	return {
		init: function(selector) {
			return new Carousel(selector);
		}
	};
	
})();
