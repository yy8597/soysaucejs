soysauce.carousels = (function() {
  // Shared Default Globals
  var AUTOSCROLL_INTERVAL = 5000;
  var PEEK_WIDTH = 20;
  var TRANSITION_END = "transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd";
  var VENDOR_PREFIX = soysauce.getPrefix();
  var SWIPE_THRESHOLD = 100;
  var ZOOM_SENSITIVITY = 0.2;
  
  function Carousel(selector) {
    var options;
    var self = this;
    var wrapper;
    var dotsHtml = "";
    var numDots;

    // Base Variables
    this.widget = $(selector);
    this.index = 0;
    this.maxIndex;
    this.container;
    this.items;
    this.currentItem;
    this.itemPadding;
    this.dots;
    this.numChildren = 0;
    this.widgetWidth = 0;
    this.widgetHeight = 0;
    this.itemWidth = 0;
    this.interruptedOffset = 0;
    this.offset = 0;
    this.ready = false;
    this.interrupted = false;
    this.links = false;
    this.lockScroll = false;
    this.nextBtn;
    this.prevBtn;
    this.freeze = false;
    this.jumping = false;
    this.lastTransitionEnd = 0;

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

    // Peek Variables
    this.peek = false;
    this.peekWidth = 0;
    this.peekAlign;

    // Swipe Variables
    this.swipe = true;
    this.swiping = false;

    // Zoom Variables
    this.zoom = false;
    this.zoomIcon;
    this.overlay = false;
    this.isZoomed = false;
    this.zoomElement = null;
    this.zoomScale = 1;
    this.zoomScaleStart = 1;
    this.pinchEventsReady = false;

    // Multi Item Variables
    this.multi = false;
    this.multiVars = {
      numItems: 2,
      stepSize: 1,
      minWidth: 0,
      even: false
    };

    // Autoheight Variables
    this.autoheight = false;

    // Fade Variables
    this.fade = false;
    
    // Single-item Options
    if (this.widget.attr("data-ss-single-options") && this.widget.find("[data-ss-component='item']").length === 1) {
      options = this.widget.attr("data-ss-single-options").split(" ");
    }
    else {
      options = soysauce.getOptions(selector);
    }
    
    if (options) options.forEach(function(option) {
      switch(option) {
        case "peek":
          self.peek = true;
          break;
        case "finite":
          self.infinite = false;
          break;
        case "autoscroll":
          self.autoscroll = true;
          break;
        case "noswipe":
          self.swipe = false;
          break;
        case "zoom":
          self.zoom = true;
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
        case "overlay":
          self.overlay = true;
          break;
      }
    });
    
    if (this.multi) {
      this.infinite = false;
    }
    
    this.widgetWidth = this.widget.outerWidth();
    this.widget.wrapInner("<div data-ss-component='container' />");
    this.widget.wrapInner("<div data-ss-component='container_wrapper' />");
    this.container = this.widget.find("[data-ss-component='container']");
    
    wrapper = this.widget.find("[data-ss-component='container_wrapper']");

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
      this.multiVars.numItems = parseInt(this.widget.attr("data-ss-multi-set"), 10) || 2;
      this.multiVars.minWidth = parseInt(this.widget.attr("data-ss-multi-min-width"), 10) || 0;
      this.multiVars.stepSize = parseInt(this.widget.attr("data-ss-step-size"), 10) || this.multiVars.numItems;
      this.maxIndex = Math.ceil(this.maxIndex / this.multiVars.stepSize);
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

    this.items = this.widget.find("[data-ss-component='item']");
    this.itemPadding = parseInt(this.items.first().css("padding-left"), 10) + parseInt(this.items.first().css("padding-right"), 10);

    if (this.multi) {
      this.multiVars.even = (this.items.length % this.multiVars.numItems === 0) ? true : false;
    }

    if (!this.items.length) {
      console.warn("Soysauce: Carousel cannot be instantiated; no items found.");
      return;
    }

    this.numChildren = this.items.length;

    if (!this.infinite) {
      wrapper.find("~ [data-ss-button-type='next']").attr("data-ss-state", (this.numChildren > 1) ? "enabled" : "disabled");
    }
    else {
      wrapper.find("~ [data-ss-button-type='next']").attr("data-ss-state", "enabled");
    }

    this.links = (!this.items[0].tagName.match(/^a$/i) && !this.items.find("a[href]").length) ? false : true;

    numDots = (this.infinite) ? this.numChildren - 2 : this.numChildren;
    numDots = (this.multi) ? this.maxIndex : numDots;

    for (i = 0; i < numDots; i++) {
      dotsHtml += "<div data-ss-component='dot'></div>";
    }

    this.dots.html(dotsHtml);
    this.dots = this.dots.find("div");
    this.dots.attr("data-ss-state", "inactive")
    this.dots.first().attr("data-ss-state", "active");
    this.dots.on("click", function(e) {
      var currXPos = parseInt(soysauce.getArrayFromMatrix(self.container.css(VENDOR_PREFIX + "transform"))[4], 10);
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
      this.peekWidth = parseInt(this.widget.attr("data-ss-peek-width"), 10) || PEEK_WIDTH;
      if (this.peekWidth % 2) {
        this.widget.attr("data-ss-peek-width", ++this.peekWidth);
      }
    }
    
    this.items.attr("data-ss-state", "inactive");

    if (this.infinite) {
      $(this.items[1]).attr("data-ss-state", "active");
      this.index++;
    }
    else {
      if (this.multi) {
        var $items = $(this.items.slice(0, this.multiVars.numItems));
        $items.attr("data-ss-state", "active");
      }
      else {
        $(this.items[0]).attr("data-ss-state", "active");
      }
    }
    
    this.container.imagesLoaded(function(items) {
      var firstItem = self.items.first();
      var margin = parseInt(firstItem.css("margin-left"), 10) + parseInt(firstItem.css("margin-right"), 10);

      if (self.multi) {
        if (self.multiVars.minWidth > 0) {
          self.multiVars.numItems = Math.floor(self.widgetWidth / self.multiVars.minWidth);
        }
        self.itemWidth = self.widgetWidth / self.multiVars.numItems;
      }
      else {
        self.itemWidth = self.widgetWidth;
      }

      if (self.peek) {
        self.itemWidth -= self.peekWidth*2;
        switch (self.peekAlign) {
          case "center":
            self.offset += self.peekWidth;
            break;
          case "left":
            break;
          case "right":
            self.offset += (self.peekWidth * 2);
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
      
      self.widgetHeight = self.widget.outerHeight(true);
    });
    
    if (this.links) {
      this.container.find("a[href]").each(function(e) {
        var $this = $(this);
        var href = $this.attr("href");
        $this.attr("data-ss-href", href).attr("href", "");
      });
      this.container.hammer().on("tap click", function(e) {
        var $target;
        
        if (!self.ready || e.type === "click") return false;
        
        $target = $(e.target);
        
        if (e.target.tagName === "A" || $target.find("a").length) {
          window.location.href = $target.attr("data-ss-href") || $target.find("a").attr("data-ss-href");
        }
      });
    }

    if (this.swipe) {
      // Temporary Fix - Fixes iOS 7 swipe issue
      if (/iphone os 7/i.test(navigator.userAgent)) {
        var $ios7fix = $("#ios7fix");
        if (!$ios7fix.length) {
          $("body").append("<div id='ios7fix' style='color: transparent; z-index: -1; height: 1px; width: 1px; position: absolute; top: 0; left: 0;'></div>");
        } 
        this.container.on("touchmove touchend", function(e) {
          $ios7fix.html(e.type);
        });
      }
      // end of temp fix
      this.container.hammer().on("touch release drag swipe", function(e) {
        if (self.freeze) return;
        self.handleSwipe(e);
      });
    }
    
    if (this.zoom) {
      wrapper.after("<div data-ss-component='zoom_icon' data-ss-state='out'></div>");
      this.zoomIcon = wrapper.find("~ [data-ss-component='zoom_icon']");
      this.container.hammer().on("tap", function(e) {
        self.zoomIn(e);
      });
    }
    
    this.currentItem = $(this.items.get(self.index));

    if (this.overlay) {
      this.zoomElement = this.currentItem;
      this.container.hammer().on("pinch", function(e) {
        if (e.gesture.touches.length !== 2) return;
        self.handleZoom(e);
      });
    }
    
    this.container.on(TRANSITION_END, function(e) {
      self.setTransitionedStates(e);
    });
    
    if (this.autoscroll) {
      this.autoscrollOn();
    }

    if (this.autoheight) {
      var height = $(this.items[this.index]).outerHeight(true);
      this.widget.css("min-height", height);
    }
    
    this.widget.one("SSWidgetReady", function() {
      self.widget.attr("data-ss-state", "ready");
      self.ready = true;
      window.setTimeout(function() {
        self.container.attr("data-ss-state", "ready");
        }, 0);
        if (self.autoheight) {
          var height = $(self.items[self.index]).outerHeight(true);
          self.widget.css("height", height);
          window.setTimeout(function() {
            self.widget.css("min-height", "0px");
          }, 300);
        }
      });
  } // End Constructor
  
  Carousel.prototype.handleZoom = function(e) {
    var self = this;
    
    if (this.swiping) return;
    
    // To be implemented:
    //  * center focused zooming
    //  * panning
    if (!this.pinchEventsReady) {
      this.zoomElement = this.currentItem;
      this.zoomElement.attr("data-ss-state", "zooming");
      this.handleFreeze();
      soysauce.overlay.hideAssets();
      this.container.one("touchend", function() {
        self.zoomElement.attr("data-ss-state", "active");
      });
      this.container.hammer().one("release", function(releaseEvent) {
        soysauce.stifle(releaseEvent);
        
        if (self.zoomScale <= 1) {
          self.zoomScale = 1;
          self.handleUnfreeze();
          soysauce.overlay.showAssets();
        }
        else if (self.zoomScale >= 2) {
          self.zoomScale = 2;
        }
        
        self.zoomScaleStart = self.zoomScale;
        self.pinchEventsReady = false;
        
        setMatrix(self.zoomElement[0], self.zoomScale);
      });
      this.pinchEventsReady = true;
    }

    if (e.gesture.scale < 1) {
      this.zoomScale = this.zoomScaleStart - ((this.zoomScaleStart - e.gesture.scale) * (1 - ZOOM_SENSITIVITY));
    }
    else {
      this.zoomScale = ((e.gesture.scale - 1) * (1 - ZOOM_SENSITIVITY)) + this.zoomScaleStart;
    }
    
    this.zoomScale = (this.zoomScale < 0.3) ? 0.3 : this.zoomScale;
    this.zoomElement.attr("data-ss-state", "zooming");

    setMatrix(this.zoomElement[0], this.zoomScale);
  };
  
  Carousel.prototype.zoomIn = function(e) {
    if (this.overlay) return;
    soysauce.stifle(e);
    soysauce.overlay.injectCarousel(this, {
      "background": "black",
      "opacity": "1"
    });
  };
  
  Carousel.prototype.resetZoomState = function() {
    this.zoomElement.css((VENDOR_PREFIX + "transform"), "");
    this.zoomScale = 1;
    this.zoomScaleStart = 1;
    this.zoomElement = this.currentItem;
  };
  
  Carousel.prototype.handleSwipe = function(e) {
    var targetComponent = $(e.target).attr("data-ss-component");
    var self = this;
    
    if (self.jumping || self.freeze || self.looping) return;

    if (e.type === "swipe" && e.gesture.eventType === "end" && !self.ready) {
      self.ready = true;
      self.interrupted = false;
      self.swiping = false;
      self.widget.attr("data-ss-state", "ready");
      self.container.attr("data-ss-state", "ready");
      return;
    }
    
    if (self.lockScroll && e.type === "release") {
      self.lockScroll = false;
      self.widget.attr("data-ss-state", "ready");
      self.container.attr("data-ss-state", "ready");
      window.setTimeout(function() {
        setTranslate(self.container[0], self.offset);
      }, 0);
      return;
    }
    
    if (self.lockScroll) {
      return;
    }
    
    self.lockScroll = (Math.abs(e.gesture.angle) >= 75 && Math.abs(e.gesture.angle) <= 105) ? true : false;
    
    if (self.lockScroll) {
      return;
    }

    if (!self.ready && e.type === "touch") {
      self.interruptedOffset = (soysauce.vars.degrade) ? parseInt(self.container[0].style.left, 10) : parseInt(soysauce.getArrayFromMatrix(self.container.css(VENDOR_PREFIX + "transform"))[4], 10);
      self.interrupted = true;
      self.looping = false;
      self.container.attr("data-ss-state", "notransition");
      self.widget.attr("data-ss-state", "intransit");
      setTranslate(self.container[0], self.interruptedOffset);
      return;
    }
    
    if (e.type !== "touch" && !self.overlay) {
      soysauce.stifle(e);
    }
    
    if (e.gesture.eventType === "end") {
      var swiped = (e.gesture.velocityX >= Hammer.gestures.Swipe.defaults.swipe_velocity) ? true : false;
      var doSwipe = (swiped || e.gesture.distance >= SWIPE_THRESHOLD) ? true : false;

      self.ready = true;
      self.swiping = false;
      
      self.widget.attr("data-ss-state", "intransit");
      self.container.attr("data-ss-state", "intransit");
      
      if (doSwipe && e.gesture.direction === "left") {
        if (!self.infinite && ((self.index === self.numChildren - 1) 
        || (self.multi && self.index === self.maxIndex - Math.floor(self.multiVars.numItems / self.multiVars.stepSize)))) {
          if (self.multi)  {
            if (self.index === self.maxIndex - 1) {
              self.gotoPos(self.offset);
            }
            else {
              self.gotoPos(self.index * -self.itemWidth * self.multiVars.stepSize + self.peekWidth);
            }
          }
          else {
            self.gotoPos(self.index * -self.itemWidth + self.peekWidth);
          }
        }
        else {
          if (soysauce.vars.degrade) {
            self.rewindCoord = parseInt(self.container.css("left"), 10);
          }
          self.slideForward();
        }
      }
      else if (doSwipe && e.gesture.direction === "right") {
        if (!self.infinite && self.index === 0) {
          self.gotoPos(self.peekWidth);
        }
        else {
          if (soysauce.vars.degrade) {
            self.rewindCoord = parseInt(self.container.css("left"), 10);
          }
          self.slideBackward();
        }
      }
      else {
        setTranslate(self.container[0], self.offset);
      }
    }
    else if (e.gesture.eventType === "move") {
      self.swiping = true;
      self.ready = false;
      
      self.container.attr("data-ss-state", "notransition");
      self.widget.attr("data-ss-state", "intransit");
      
      if (self.interrupted) {
        setTranslate(self.container[0], self.interruptedOffset + e.gesture.deltaX);
      }
      else {
        setTranslate(self.container[0], self.offset + e.gesture.deltaX);
      }
    }
  };
  
  Carousel.prototype.gotoPos = function(x, jumping, resettingPosition) {
    var self = this;

    if (this.overlay) {
      this.currentItem = $(this.items.get(self.index));
      this.resetZoomState();
    }

    this.offset = x;
    setTranslate(this.container[0], x);
    
    this.container.attr("data-ss-state", "intransit");
    this.widget.attr("data-ss-state", "intransit");
    this.ready = true;
    
    if (this.autoscroll) {
      this.autoscrollOff();
      if (this.autoscrollRestartID) {
        window.clearInterval(self.autoscrollRestartID);
        this.autoscrollRestartID = null;
      }
    }
    
    if (this.infinite) {
      var duration = 0, xcoord = 0;
      
      duration = parseFloat(this.container.css(VENDOR_PREFIX + "transition-duration").replace(/s$/,"")) * 1000;
      
      duration = (!duration) ? 650 : duration;
      // Slide Backward Rewind
      if (!resettingPosition && !jumping && this.index === this.numChildren - 2 && !this.forward) {
        this.looping = true;
        this.infiniteID = window.setTimeout(function() {
          xcoord = (soysauce.vars.degrade) ? self.rewindCoord : parseInt(soysauce.getArrayFromMatrix(self.container.css(VENDOR_PREFIX + "transform"))[4], 10);
          self.container.attr("data-ss-state", "notransition");
          self.offset = xcoord - self.itemWidth*(self.numChildren - 2);
          setTranslate(self.container[0], self.offset);
          window.setTimeout(function() {
            self.container.attr("data-ss-state", "intransit");
            if (self.peek && /left/.test(self.peekAlign)) {
              self.offset = -self.index*self.itemWidth;
            }
            else {
              self.offset = -self.index*self.itemWidth + self.peekWidth;
            }
            setTranslate(self.container[0], self.offset);
            self.looping = false;
          }, 0);
        }, 0);
      }
      // Slide Forward Rewind
      else if (!resettingPosition && !jumping && this.index === 1 && this.forward) {
        this.looping = true;
        this.infiniteID = window.setTimeout(function() {
          xcoord = (soysauce.vars.degrade) ? self.rewindCoord : parseInt(soysauce.getArrayFromMatrix(self.container.css(VENDOR_PREFIX + "transform"))[4], 10);
          self.container.attr("data-ss-state", "notransition");
          self.offset = self.itemWidth*(self.numChildren - 2) + xcoord;
          setTranslate(self.container[0], self.offset);
          window.setTimeout(function() {
            self.container.attr("data-ss-state", "intransit");
            if (self.peek && /left/.test(self.peekAlign)) {
              self.offset = -self.itemWidth;
            }
            else {
              self.offset = -self.itemWidth + self.peekWidth;
            }
            setTranslate(self.container[0], self.offset);
            self.looping = false;
          }, 0);
        }, 0);
      }
      else {
        this.infiniteID = null;
      }
    }
  };
  
  Carousel.prototype.slideForward = function() {
    var $dots = (this.infinite) ? $(this.dots[this.index - 1]) : $(this.dots[this.index]),
        lastInfiniteIndex = this.numChildren - 1,
        stepSize = (this.multi) ? this.multiVars.stepSize * this.itemWidth : this.itemWidth;
    
    if (!this.ready || this.isZooming ||
      (!this.infinite && this.index === lastInfiniteIndex) ||
      (!this.infinite && this.multi && this.index === this.maxIndex - 1)) return false;
    
    $dots.attr("data-ss-state", "inactive");
    
    if (this.multi) {
      var $items = $(this.items.slice(this.index * this.multiVars.stepSize, this.index * this.multiVars.stepSize + this.multiVars.numItems));
      $items.attr("data-ss-state", "inactive");
      this.index++;
    }
    else {
      $(this.items[this.index++]).attr("data-ss-state", "inactive");
    }
    
    if (this.infinite && this.index === lastInfiniteIndex) {
      $(this.items[1]).attr("data-ss-state", "active");
      this.index = 1;
    }
    else {
      if (this.multi) {
        var $items;
        if (!this.multiVars.even && this.index === this.maxIndex - 1) {
          $items = $(this.items.slice(this.items.length - this.multiVars.stepSize, this.items.length));
        }
        else {
          $items = $(this.items.slice(this.index * this.multiVars.stepSize, this.index * this.multiVars.stepSize + this.multiVars.numItems));
        }
        $items.attr("data-ss-state", "active");
      }
      else {
        $(this.items[this.index]).attr("data-ss-state", "active");
      }
    }
    
    $dots = (this.infinite) ? $(this.dots[this.index - 1]) : $(this.dots[this.index]);
    $dots.attr("data-ss-state", "active");

    if (!this.infinite) {
      if (this.index === lastInfiniteIndex || (this.multi && this.index === this.maxIndex - 1)) {
        this.nextBtn.attr("data-ss-state", "disabled");
      }
      if (this.numChildren > 1) {
        this.prevBtn.attr("data-ss-state", "enabled");
      }
    }
    
    this.ready = false;
    this.forward = true;
    
    if (this.multi && !this.multiVars.even && this.index === this.maxIndex - 1) {
      stepSize -= (this.multiVars.stepSize - (this.items.length % this.multiVars.stepSize)) * this.itemWidth;
    }
    
    this.gotoPos(this.offset - stepSize);
    
    return true;
  };
  
  Carousel.prototype.slideBackward = function() {
    var $dots = (this.infinite) ? $(this.dots[this.index - 1]) : $(this.dots[this.index]),
        lastInfiniteIndex = this.numChildren - 1,
        stepSize = (this.multi) ? this.multiVars.stepSize * this.itemWidth : this.itemWidth;
    
    if (!this.ready || (!this.infinite && this.index === 0) || this.isZooming) return false;
    
    $dots.attr("data-ss-state", "inactive");
    
    if (this.multi) {
      var $items = $(this.items.slice(this.index * this.multiVars.stepSize, this.index * this.multiVars.stepSize + this.multiVars.numItems));
      $items.attr("data-ss-state", "inactive");
      this.index--;
    }
    else {
      $(this.items[this.index--]).attr("data-ss-state", "inactive");
    }
    
    if (this.infinite && this.index === 0) {
      $(this.items[lastInfiniteIndex - 1]).attr("data-ss-state", "active");
      this.index = lastInfiniteIndex - 1;
    }
    else {
      if (this.multi) {
        var $items = $(this.items.slice(this.index * this.multiVars.stepSize, this.index * this.multiVars.stepSize + this.multiVars.numItems));
        $items.attr("data-ss-state", "active");
      }
      else {
        $(this.items[this.index]).attr("data-ss-state", "active");
      }
    }
    
    $dots = (this.infinite) ? $(this.dots[this.index - 1]) : $(this.dots[this.index]);
    $dots.attr("data-ss-state", "active");
    
    if (!this.infinite) {
      if (this.index === 0) {
        this.prevBtn.attr("data-ss-state", "disabled");
      }
      if (this.numChildren > 1) {
        this.nextBtn.attr("data-ss-state", "enabled");
      }
    }
      
    this.ready = false;
    this.forward = false;
    
    if (this.multi && !this.multiVars.even && this.index === 0) {
      this.gotoPos(0 + this.peekWidth);
    }
    else {
      this.gotoPos(this.offset + stepSize);
    }
    
    return true;
  };
  
  Carousel.prototype.handleResize = function() {
    var parentWidgetContainer;
    var diff = 0;
    var prevState = "";
    
    if (this.widget.is(":hidden") && !this.defer) return;

    this.widgetWidth = this.widget.outerWidth();

    // Assumption: parent is a toggler
    if (!this.widgetWidth) parentWidgetContainer = this.widget.parents().closest("[data-ss-widget='toggler'] [data-ss-component='content']");

    if (parentWidgetContainer) {
      parentWidgetContainer.css("display", "block");
      this.widgetWidth = this.widgetWidth || parentWidgetContainer.outerWidth();
    }

    if (this.fade) {
      return;
    }
    
    if (this.multi) {
      if (this.multiVars.minWidth) {
        this.multiVars.numItems = Math.floor(this.widgetWidth / this.multiVars.minWidth)
      }
      this.itemWidth = this.widgetWidth / this.multiVars.numItems;
    }

    prevState = this.container.attr("data-ss-state");

    if (this.multi) {
      diff = this.widgetWidth - (this.itemWidth * this.multiVars.numItems);
    }
    else {
      diff = this.widgetWidth - this.itemWidth;
    }

    if (this.peek) {
      this.itemWidth -= this.peekWidth*2;
    }

    this.itemWidth += diff;

    if (this.peek && /left/.test(this.peekAlign)) {
      this.offset = -this.index * this.itemWidth;
    }
    else {
      this.offset = -this.index * this.itemWidth + this.peekWidth;
    }

    this.container.attr("data-ss-state", "notransition");
    this.widget.attr("data-ss-state", "intransit");

    this.items.css("width", this.itemWidth + "px");

    setTranslate(this.container[0], this.offset);

    this.container.css("width", (this.itemWidth * this.numChildren) + "px");

    if (this.autoheight) {
      this.widget.css("height", $(this.items[this.index]).outerHeight(true));
    }
  };
  
  Carousel.prototype.autoscrollOn = function(forceEnable) {
    var self = this;
    
    if (!this.autoscroll && !forceEnable) return false;
    
    this.autoscroll = !forceEnable ? this.autoscroll : true;
    
    if (!this.autoscrollID) {
      if (!this.autoscrollInterval) {
        var interval = this.widget.attr("data-ss-autoscroll-interval");
        this.autoscrollInterval = (!interval) ? AUTOSCROLL_INTERVAL : parseInt(interval, 10);
      }
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
  
  Carousel.prototype.autoscrollOff = function(freezing) {
    var self = this;
    if (!this.autoscroll || !this.autoscrollID && !freezing) return false;
    window.clearInterval(self.autoscrollID);
    this.autoscrollID = null;
    return true;
  };
  
  Carousel.prototype.handleFreeze = function() {
    if (this.freeze) return;
    this.freeze = true;
    this.autoscrollOff(true);
    return true;
  };
  
  Carousel.prototype.handleUnfreeze = function() {
    if (!this.freeze) return;
    this.freeze = false;
    this.autoscrollOn();
    return true;
  };
  
  Carousel.prototype.jumpTo = function(index, noZoomTransition) {
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

    var newOffset = index * -this.itemWidth + this.peekWidth;

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
      var newHeight = $(this.items[index]).outerHeight(true);
      this.widget.height(newHeight);
    }

    this.gotoPos(newOffset, true);
    this.index = index;

    return true;
  };
  
  Carousel.prototype.setTransitionedStates = function(e) {
    var self = this;
    
    if (Math.abs(e.timeStamp - self.lastTransitionEnd) < 300) return;

    self.lastTransitionEnd = e.timeStamp;
    self.widget.trigger("slideEnd");
    self.ready = true;
    self.jumping = false;
    self.interrupted = false;
    self.swiping = false;
    self.looping = false;
    self.container.attr("data-ss-state", "ready");
    self.widget.attr("data-ss-state", "ready");

    if (self.autoscroll && !self.autoscrollRestartID) {
      self.autoscrollRestartID = window.setTimeout(function() {
        self.autoscrollOn();
      }, 1000);
    }
    
    if (self.autoheight) {
      self.widget.css("height", $(self.items[self.index]).outerHeight(true));
    }
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
  
  function setMatrix(element, scale, x, y) {
    x = x || 0;
    y = y || 0;
    element.style.webkitTransform = 
    element.style.msTransform = 
    element.style.OTransform = 
    element.style.MozTransform = 
    element.style.transform = 
      "matrix(" + scale + ",0,0," + scale + "," + x + "," + y + ")";
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
