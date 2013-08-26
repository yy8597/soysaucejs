/*
 * jQuery imagesLoaded plugin v2.1.1
 * http://github.com/desandro/imagesloaded
 *
 * MIT License. by Paul Irish et al.
 */

/*jshint curly: true, eqeqeq: true, noempty: true, strict: true, undef: true, browser: true */
/*global jQuery: false */

;(function($, undefined) {
'use strict';

// blank image data-uri bypasses webkit log warning (thx doug jones)
var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

$.fn.imagesLoaded = function( callback ) {
  var $this = this,
    deferred = $.isFunction($.Deferred) ? $.Deferred() : 0,
    hasNotify = $.isFunction(deferred.notify),
    $images = $this.find('img').add( $this.filter('img') ),
    loaded = [],
    proper = [],
    broken = [];

  // Register deferred callbacks
  if ($.isPlainObject(callback)) {
    $.each(callback, function (key, value) {
      if (key === 'callback') {
        callback = value;
      } else if (deferred) {
        deferred[key](value);
      }
    });
  }

  function doneLoading() {
    var $proper = $(proper),
      $broken = $(broken);

    if ( deferred ) {
      if ( broken.length ) {
        deferred.reject( $images, $proper, $broken );
      } else {
        deferred.resolve( $images );
      }
    }

    if ( $.isFunction( callback ) ) {
      callback.call( $this, $images, $proper, $broken );
    }
  }

  function imgLoadedHandler( event ) {
    imgLoaded( event.target, event.type === 'error' );
  }

  function imgLoaded( img, isBroken ) {
    // don't proceed if BLANK image, or image is already loaded
    if ( img.src === BLANK || $.inArray( img, loaded ) !== -1 ) {
      return;
    }

    // store element in loaded images array
    loaded.push( img );

    // keep track of broken and properly loaded images
    if ( isBroken ) {
      broken.push( img );
    } else {
      proper.push( img );
    }

    // cache image and its state for future calls
    $.data( img, 'imagesLoaded', { isBroken: isBroken, src: img.src } );

    // trigger deferred progress method if present
    if ( hasNotify ) {
      deferred.notifyWith( $(img), [ isBroken, $images, $(proper), $(broken) ] );
    }

    // call doneLoading and clean listeners if all images are loaded
    if ( $images.length === loaded.length ) {
      setTimeout( doneLoading );
      $images.unbind( '.imagesLoaded', imgLoadedHandler );
    }
  }

  // if no images, trigger immediately
  if ( !$images.length ) {
    doneLoading();
  } else {
    $images.bind( 'load.imagesLoaded error.imagesLoaded', imgLoadedHandler )
    .each( function( i, el ) {
      var src = el.src;

      // find out if this image has been already checked for status
      // if it was, and src has not changed, call imgLoaded on it
      var cached = $.data( el, 'imagesLoaded' );
      if ( cached && cached.src === src ) {
        imgLoaded( el, cached.isBroken );
        return;
      }

      // if complete is true and browser supports natural sizes, try
      // to check for image status manually
      if ( el.complete && el.naturalWidth !== undefined ) {
        imgLoaded( el, el.naturalWidth === 0 || el.naturalHeight === 0 );
        return;
      }

      // cached images don't fire load sometimes, so we reset src, but only when
      // dealing with IE, or image is complete (loaded) and failed manual check
      // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
      if ( el.readyState || el.complete ) {
        el.src = BLANK;
        el.src = src;
      }
    });
  }

  return deferred ? deferred.promise( $this ) : $this;
};

})(jQuery);

if(typeof(soysauce) === "undefined") {
"use strict";

soysauce = {
  widgets: new Array(),
  vars: {
    idCount: 0,
    currentViewportWidth: window.innerWidth,
    degradeAll: (/Android ([12]|4\.0)|Opera|SAMSUNG-SGH-I747|SCH-I535/.test(navigator.userAgent)) ? true : false,
    degrade: (/Android ([12]|4\.0)|Opera|SAMSUNG-SGH-I747/.test(navigator.userAgent)) ? true : false,
    degrade2: (/SCH-I535/.test(navigator.userAgent)) ? true : false,
    lastResizeTime: 0,
    lastResizeTimerID: 0,
    fastclick: []
  },
  getOptions: function(selector) {
    if(!$(selector).attr("data-ss-options")) return false;
    return $(selector).attr("data-ss-options").split(" ");
  },
  getPrefix: function() {
    if (navigator.userAgent.match(/webkit/i) !== null) return "-webkit-";
    else if (navigator.userAgent.match(/windows\sphone|msie/i) !== null) return "-ms-";
    else if (navigator.userAgent.match(/^mozilla/i) !== null) return "-moz-";
    else if (navigator.userAgent.match(/opera/i) !== null) return "-o-";
    return "";
  },
  stifle: function(e, onlyPropagation) {
    if (!e) return false;
    try {
      e.stopImmediatePropagation();
    }
    catch(err) {
      e.propagationStopped = true;
    }
    if (onlyPropagation) return false;
    e.preventDefault();
  },
  fetch: function(selector) {
    var query, ret;
    
    if (!selector) return false;
    
    if (typeof(selector) === "object") {
      selector = parseInt($(selector).attr("data-ss-id"), 10);
    }
    
    if (typeof(selector) === "string") {
      var val = parseInt($(selector).attr("data-ss-id"), 10);;

      if (isNaN(val)) {
        val = parseInt(selector, 10);
      }

      selector = val;
    }
    
    if (selector===+selector && selector === (selector|0)) {
      query = "[data-ss-id='" + selector + "']";
    }
    else {
      query = selector;
    }

    soysauce.widgets.forEach(function(widget) {
      if (widget.id === selector) {
        ret = widget;
      }
    });

    if (!ret) {
      return false;
    }
    else {
      return ret;
    }
  },
  getCoords: function(e) {
    if (!e) return;
    if (e.originalEvent !== undefined) e = e.originalEvent;
    if (e.touches && e.touches.length === 1)
      return {x: e.touches[0].clientX, y: e.touches[0].clientY};
    else if (e.touches && e.touches.length === 2)
      return {x: e.touches[0].clientX, y: e.touches[0].clientY, x2: e.touches[1].clientX, y2: e.touches[1].clientY};
    else if (e.changedTouches && e.changedTouches.length === 1)
      return {x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY};
    else if (e.changedTouches && e.changedTouches.length === 2)
      return {x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY, x2: e.changedTouches[1].clientX, y2: e.changedTouches[1].clientY};
    else if (e.clientX !== undefined)
      return {x: e.clientX, y: e.clientY};
  },
  getArrayFromMatrix: function(matrix) {
    return matrix.substr(7, matrix.length - 8).split(', ');
  },
  browserInfo: {
    pageLoad: new Date().getTime(),
    userAgent: navigator.userAgent,
    supportsSVG: (document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")) ? true : false,
    supportsLocalStorage: function() {
      try { 
        if (localStorage) {
          localStorage.setItem("test", 1);
          localStorage.removeItem("test");
          return true;
        }
        else { 
          return false; 
        }
      }
      catch(err) { 
        return false;
      }
    }(),
    supportsSessionStorage: function() {
      try { 
        if (sessionStorage) {
          sessionStorage.setItem("test", 1);
          sessionStorage.removeItem("test");
          return true;
        }
        else { 
          return false; 
        }
      }
      catch(err) { 
        return false;
      }
    }()
  },
  scrollTop: function() {
    window.setTimeout(function(){
      window.scrollTo(0, 1);
    }, 0);
  }
}

// Widget Resize Handler
$(window).on("resize orientationchange", function(e) {
  if (e.type === "orientationchange" || window.innerWidth !== soysauce.vars.currentViewportWidth) {
    if (soysauce.vars.lastResizeID) clearTimeout(soysauce.vars.lastResizeID);
    soysauce.vars.lastResizeID = window.setTimeout(function() {
      soysauce.vars.lastResizeTime = e.timeStamp;
      soysauce.vars.currentViewportWidth = window.innerWidth;
      soysauce.widgets.forEach(function(widget) {
        if (!widget.handleResize) return;
        widget.handleResize();
        if (/carousel/i.test(widget.type)) {
          if (widget.itemWidth) {
            $(widget.widget).trigger("SSWidgetResized");
          }
        }
        else {
          $(widget.widget).trigger("SSWidgetResized");
        }
      });
    }, 30);
  }
});

// Widget Initialization
$(document).ready(function() {
  soysauce.init();
  if (soysauce.vars.degradeAll) {
    $("body").attr("data-ss-degrade", "true");
  }
  soysauce.widgets.forEach(function(obj) {
    if (!obj.defer) return;
    var deferCount = 0;
    var innerWidgets = obj.widget.find("[data-ss-widget]");
    innerWidgets.each(function() {
      var widget = soysauce.fetch(this);
      if (widget.initialized) {
        if (++deferCount === innerWidgets.length) {
          $(obj.widget).trigger("SSWidgetReady").removeAttr("data-ss-defer");
          return;
        }
      }
      else {
        widget.widget.on("SSWidgetReady", function() {
          if (++deferCount === innerWidgets.length) {
            $(obj.widget).trigger("SSWidgetReady").removeAttr("data-ss-defer");
          }
        });
      }
    });
  });
  $(window).trigger("SSReady");
});

$(window).load(function() {
  var cachedLazyLoader = soysauce.fetch("[data-ss-widget='lazyloader'][data-ss-options*='cache']");
  if (cachedLazyLoader && cachedLazyLoader.isCached) return;
  if (!$(this).scrollTop()) {
    soysauce.scrollTop();
  }
});

}

soysauce.init = function(selector, manual) {
  var set;
  var numItems = 0;
  var ret = false;
  var fastclickSelectors = "";
  
  fastclickSelectors = "[data-ss-widget='toggler'] > [data-ss-component='button']";
  fastclickSelectors += ", [data-ss-widget='carousel'] [data-ss-component='button']";
  
  $(fastclickSelectors).each(function() {
    soysauce.vars.fastclick.push(FastClick.attach(this));
  });
  
  if (!selector) {
    set = $("[data-ss-widget]:not([data-ss-id]), [data-ss-component='button'][data-ss-toggler-id]");
  }
  else {
    set = $(selector);
  }
  
  if ((!$(selector) && !set) || $(selector).attr("data-ss-id") !== undefined) return ret;
  
  numItems = set.length;
  
  set.each(function(i) {
    var $this = $(this);
    var type = $(this).attr("data-ss-widget");
    var widget;
    var orphan = false;
    
    if (!type && $this.attr("data-ss-toggler-id") !== undefined) {
      type = "toggler";
      orphan = true;
    }
    
    if (!manual && /manual/.test($this.attr("data-ss-init"))) {
      return;
    }
    
    $this.attr("data-ss-id", ++soysauce.vars.idCount);
    
    switch (type) {
      case "toggler":
        widget = soysauce.togglers.init(this, orphan);
        break;
      case "carousel":
        widget = soysauce.carousels.init(this);
        break;
      case "lazyloader":
        widget = soysauce.lazyloader.init(this);
        break;
      case "autofill-zip":
        widget = soysauce.autofillZip.init(this);
        break;
      case "autodetect-cc":
        widget = soysauce.autodetectCC.init(this);
        break;
      case "autosuggest":
        widget = soysauce.autosuggest.init(this);
        break;
      case "input-clear":
        widget = soysauce.inputClear.init(this);
        break;
    }

    if (widget !== undefined) {
      widget.type = type;
      widget.id = soysauce.vars.idCount;
      soysauce.widgets.push(widget);
      ret = true;
      if ($this.attr("data-ss-defer") !== undefined) {
        widget.defer = true;
      }
      else {
        $this.imagesLoaded(function() {
          widget.initialized = true;
          $this.trigger("SSWidgetReady");
        });
      }
    }
    else {
      $this.removeAttr("data-ss-id");
      --soysauce.vars.idCount;
    }
  });
  
  return ret;
}

soysauce.carousels = (function() {
  // Shared Default Globals
  var AUTOSCROLL_INTERVAL = 5000;
  var DEFAULT_SCALE = 2; // on initial zoom
  var PEEK_WIDTH = 20;
  var TRANSITION_END = "transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd";
  var PINCH_SENSITIVITY = 1500; // lower to increase sensitivity for pinch zoom
  var PREFIX = soysauce.getPrefix();
  
  function Carousel(selector) {
    var options;
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
    this.itemPadding;
    this.dots;
    this.numChildren = 0;
    this.widgetWidth = 0;
    this.widgetHeight = 0;
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

    // Zoom Variables
    this.zoom = false;
    this.zoomMin;
    this.zoomMax;
    this.isZooming = false;
    this.isZoomed = false;
    this.panMax = {x:0, y:0};
    this.panCoords = {x:0, y:0};
    this.panCoordsStart = {x:0, y:0};
    this.panning = false;
    this.zoomIcon;
    this.pinch = false;
    this.scale;

    // Thumbnail Variables
    this.thumbs = false;

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

    if (this.swipe) this.widget.find("a").click(function(e) {
      soysauce.stifle(e);
    });
    
    this.widgetWidth = this.widget.outerWidth();
    this.widget.wrapInner("<div data-ss-component='container' />");
    this.widget.wrapInner("<div data-ss-component='container_wrapper' />");
    this.container = this.widget.find("[data-ss-component='container']");

    wrapper = this.widget.find("[data-ss-component='container_wrapper']");

    if (this.zoom) {
      wrapper.after("<div data-ss-component='zoom_icon' data-ss-state='out'></div>");
      this.zoomIcon = wrapper.find("~ [data-ss-component='zoom_icon']");
      this.zoomMin = parseFloat(this.widget.attr("data-ss-zoom-min")) || 1.2;
      this.zoomMax = parseFloat(this.widget.attr("data-ss-zoom-max")) || 4;
      this.scale = DEFAULT_SCALE;

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
    numDots = (this.multi) ? this.maxIndex : numDots;
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
      var currXPos = parseInt(soysauce.getArrayFromMatrix(self.container.css(PREFIX + "transform"))[4], 10);
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
      
      if (self.zoom) {
        self.initPanLimits();
      }
    });

    if (this.swipe || this.zoom) this.widget.on("touchstart mousedown", function(e) {
      var targetComponent = $(e.target).attr("data-ss-component");

      if (/^(zoom_icon|dot|thumbnail)$/.test(targetComponent) && self.interrupted) {
        var currXPos = (soysauce.vars.degrade) ? parseInt(self.container[0].style.left, 10) : parseInt(soysauce.getArrayFromMatrix(self.container.css(PREFIX + "transform"))[4], 10);
        if (currXPos === self.offset) {
          self.interrupted = false;
        }
      }
      
      if (self.jumping || self.freeze || /^(button|dot|dots|thumbnail)$/.test(targetComponent)) {
        return;
      }

      self.handleSwipe(e);
    });

    this.container.on(TRANSITION_END, function(e) {
      if (Math.abs(e.timeStamp - self.lastTransitionEnd) < 300) return;

      self.lastTransitionEnd = e.timeStamp;
      self.widget.trigger("slideEnd");
      self.ready = true;
      self.jumping = false;
      self.interrupted = false;
      self.container.attr("data-ss-state", "ready");
      self.widget.attr("data-ss-state", "ready");

      if (self.autoscroll && self.autoscrollRestartID === undefined) {
        self.autoscrollRestartID = window.setTimeout(function() {
          self.autoscrollOn();
        }, 1000);
      }
      
      if (self.autoheight) {
        self.widget.css("height", $(self.items[self.index]).outerHeight(true));
      }
    });
    
    if (this.autoscroll) {
      var interval = this.widget.attr("data-ss-autoscroll-interval");
      this.autoscrollInterval = (!interval) ? AUTOSCROLL_INTERVAL : parseInt(interval, 10);
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
  
  Carousel.prototype.gotoPos = function(x, fast, jumping, resettingPosition) {
    var self = this;

    this.offset = x;
    setTranslate(this.container[0], x);
    
    if (this.ready) {
      this.container.attr("data-ss-state", "ready");
      this.widget.attr("data-ss-state", "ready");
    }
    else {
      this.container.attr("data-ss-state", (fast) ? "intransit-fast" : "intransit");
      this.widget.attr("data-ss-state", "intransit");
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
          xcoord = (soysauce.vars.degrade) ? self.rewindCoord : parseInt(soysauce.getArrayFromMatrix(self.container.css(PREFIX + "transform"))[4], 10);
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
          }, 0);
        }, 0);
      }
      // Slide Forward Rewind
      else if (!resettingPosition && !jumping && this.index === 1 && this.forward) {
        this.infiniteID = window.setTimeout(function() {
          xcoord = (soysauce.vars.degrade) ? self.rewindCoord : parseInt(soysauce.getArrayFromMatrix(self.container.css(PREFIX + "transform"))[4], 10);
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
          }, 0);
        }, 0);
      }
      else {
        this.infiniteID = undefined;
      }
    }
  };
  
  Carousel.prototype.slideForward = function(fast) {
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
    
    this.gotoPos(this.offset - stepSize, fast);
    
    return true;
  };
  
  Carousel.prototype.slideBackward = function(fast) {
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
      this.gotoPos(0 + this.peekWidth, fast);
    }
    else {
      this.gotoPos(this.offset + stepSize, fast);
    }
    
    return true;
  };
  
  Carousel.prototype.initPanLimits = function() {
    var self = this, extraPadding = 2;
    
    this.panMax.y = Math.abs(((self.items.first().height() * self.scale) - self.widgetHeight) / DEFAULT_SCALE);
    this.panMax.x = Math.abs((self.widgetWidth - ((self.itemWidth*self.scale) - (self.itemPadding*2))) / DEFAULT_SCALE);

    if (this.panMax.y === 0) {
      this.container.imagesLoaded(function() {
        self.panMax.y = Math.abs(((self.items.first().height() * self.scale) - self.widgetHeight) / DEFAULT_SCALE);
      });
    }
  };
  
  Carousel.prototype.handleResize = function() {
    var parentWidgetContainer;
    
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

    if (this.fullscreen) {
      var diff;
      var prevState = this.container.attr("data-ss-state");

      if (this.multi) {
        diff = this.widgetWidth - (this.itemWidth * this.multiVars.numItems);
      }
      else {
        diff = this.widgetWidth - this.itemWidth;
      }

      if (this.peek) {
        this.itemWidth -= this.peekWidth*2;
        this.checkPanLimits();
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
    }

    this.container.css("width", (this.itemWidth * this.numChildren) + "px");
    
    if (this.autoheight) {
      this.widget.css("height", $(this.items[this.index]).outerHeight(true));
    }
  };
  
  Carousel.prototype.handleInterrupt = function(e) {
    if (this.isZooming || this.isZoomed || !this.swipe) {
      soysauce.stifle(e);
      return;
    }
    
    var self = this;
    var coords1, coords2, ret;
    var xcoord = (soysauce.vars.degrade) ? parseInt(self.container[0].style.left, 10) : parseInt(soysauce.getArrayFromMatrix(this.container.css(PREFIX + "transform"))[4], 10);
    
    this.interrupted = true;
    
    if (this.autoscroll) {
      this.autoscrollOff();
      if (this.autoscrollRestartID !== undefined) {
        window.clearInterval(self.autoscrollRestartID);
        self.autoscrollRestartID = undefined;
      }
    }
    
    self.container.attr("data-ss-state", "notransition");
    self.widget.attr("data-ss-state", "intransit");
    
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
      
      if (!self.lockScroll) {
        if (Math.abs((coords1.y - coords2.y)/(coords1.x - coords2.x)) > 1.2) {
          self.lockScroll = "y";
        }
        else {
          self.lockScroll = "x";
        }
      }
      
      if (/^y$/.test(self.lockScroll)) {
        return;
      }
      
      soysauce.stifle(e2);
      dragOffset = coords1.x - coords2.x;
      
      setTranslate(self.container[0], xcoord - dragOffset);
    });
    
    if (this.infiniteID !== undefined) this.widget.one("touchend mouseup", function(e2) {
      self.infiniteID = undefined;
      
      if (self.index === self.numChildren - 2) {
        if (self.peek && /left/.test(self.peekAlign)) {
          self.offset = -self.index*self.itemWidth;
        }
        else {
          self.offset = -self.index*self.itemWidth + self.peekWidth;
        }
      }
      else if (self.index === 1) {
        if (self.peek && /left/.test(self.peekAlign)) {
          self.offset = -self.itemWidth;
        }
        else {
          self.offset = -self.itemWidth + self.peekWidth;
        }
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
    var zoomingIn = null;
    
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
        var prevScale = self.scale;
        this.widget.one("touchend mouseup", function(e2) {
          var array = soysauce.getArrayFromMatrix($(e2.target).css(PREFIX + "transform")),
              panX = parseInt(array[4], 10), panY = parseInt(array[5], 10), $target = $(e2.target),
              buttonName = $(e2.target).attr("data-ss-button-type"),
              componentName = $(e2.target).attr("data-ss-component"),
              $zoomImg = $(self.items[self.index]).find("img"),
              event = e2.originalEvent;
          
          if (/^(prev|next)$/.test(buttonName) || /^(dots|zoom_icon)$/.test(componentName)) return;
          
          self.panCoordsStart.x = (Math.abs(panX) > 0) ? panX : 0;
          self.panCoordsStart.y = (Math.abs(panY) > 0) ? panY : 0;
          zoomingIn = null;
          
          $zoomImg.attr("data-ss-state", "ready");
          
          if (self.pinch && event.changedTouches && event.changedTouches.length > 1) {
            var scale = prevScale + event.scale - 1;
            if (scale > self.zoomMax) {
              self.scale = self.zoomMax;
            }
            else if (scale < self.zoomMin) {
              self.scale = self.zoomMin;
            }
            else {
              self.scale += event.scale - 1;
            }
          }
          
          self.widget.off("touchmove mousemove");
        });
        this.widget.on("touchmove mousemove", function(e2) {
          var event = e2.originalEvent, 
              zoomImg = self.items[self.index],
              buttonName = $(e2.target).attr("data-ss-button-type"),
              componentName = $(e2.target).attr("data-ss-component");
          
          soysauce.stifle(e2);
          
          if (/^(prev|next)$/.test(buttonName) || /^(dots|zoom_icon)$/.test(componentName)) return;
          
          zoomImg = (!/img/i.test(zoomImg.tagName)) ? $(zoomImg).find("img")[0] : zoomImg;
          
          coords2 = soysauce.getCoords(e2);
          
          $(zoomImg).attr("data-ss-state", "panning");

          // Pinch Zooming
          if (self.pinch && event.changedTouches.length > 1) {
            var startCoords = soysauce.getCoords(event);
            var scale = prevScale + event.scale - 1;

            self.initPanLimits();
            
            if (scale >= self.zoomMin && scale <= self.zoomMax) {
              setMatrix(zoomImg, scale, self.panCoordsStart.x, self.panCoordsStart.y);
            }
          }
          // Panning
          else {
            self.panCoords.x = self.panCoordsStart.x + coords2.x - self.coords1x;
            self.panCoords.y = self.panCoordsStart.y + coords2.y - self.coords1y;

            self.checkPanLimits();
            setMatrix(e2.target, self.scale, self.panCoords.x, self.panCoords.y);
          }
        });
      }
      // Swipe Forward/Backward or Lock Scroll
      else if (this.swipe) this.widget.on("touchmove mousemove", function(e2) {
        var dragOffset,
            target_name = $(e2.target).attr("data-ss-component");
        
        coords2 = soysauce.getCoords(e2);
        
        if (/^zoom_icon$/.test(target_name)) return;
        
        if (!self.lockScroll) {
          if (Math.abs((coords1.y - coords2.y)/(coords1.x - coords2.x)) >= 1) {
            self.lockScroll = "y";
          }
          else {
            self.lockScroll = "x";
          }
        }
        
        if (/^y$/.test(self.lockScroll)) {
          return;
        }
        
        soysauce.stifle(e2);
        self.panning = true;
        lastX = coords2.x;
        dragOffset = coords1.x - coords2.x;
        self.container.attr("data-ss-state", "notransition");
        self.widget.attr("data-ss-state", "intransit");
        setTranslate(self.container[0], self.offset - dragOffset);
      });
    }

    // Decides whether to zoom or move to next/prev item
    this.widget.one("touchend mouseup", function(e2) {
      var forceZoom;
      var targetComponent = $(e2.target).attr("data-ss-component");
      
      self.widget.off("touchmove mousemove");
      
      if (self.jumping) return;
      
      soysauce.stifle(e2);
      
      if (/^button$/.test(targetComponent)) {
        return;
      }
      
      forceZoom = (/^zoom_icon$/.test(targetComponent)) ? true : false;
      
      coords2 = soysauce.getCoords(e2);
      
      if (coords2 !== null) lastX = coords2.x;

      var xDist = self.coords1x - lastX;
      var yDist = self.coords1y - coords2.y;
      
      var time = Math.abs(e2.timeStamp - e1.timeStamp);
      
      var velocity = xDist / time;
      var fast = (velocity > 0.9) ? true : false;
      
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
            self.slideForward(fast);
          }
        }
        else {
          if (!self.infinite && self.index === 0) {
            self.gotoPos(self.peekWidth);
          }
          else {
            if (soysauce.vars.degrade) {
              self.rewindCoord = parseInt(self.container.css("left"), 10);
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
      
      if (!/img/i.test(img.tagName)) {
        img = $(img).find("img")[0];
      }
      
      $(img).attr("data-ss-state", "panning");
      setMatrix(img, this.scale, this.panCoords.x, this.panCoords.y);
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
      var offset = 0, 
          targetComponent = $(e2.target).attr("data-ss-component"),
          hqZoomSrc = ($(zoomImg).attr("data-ss-zoom-src") !== undefined);

      if (hqZoomSrc) {
        zoomImg.src = $(zoomImg).attr("data-ss-zoom-src");
        $(zoomImg).removeAttr("data-ss-zoom-src");
        $(this.items[this.index]).append("<div data-ss-component='loader'>Loading...</div>");
      }
      
      $(zoomImg).imagesLoaded(function() {
        if (hqZoomSrc) {
          $(self.items[self.index]).find("[data-ss-component='loader']").hide();
        }
        
        if (/^zoom_icon$/.test(targetComponent)) {
          self.panCoords = {x: 0, y: 0};
          self.panCoordsStart = {x: 0, y: 0};
        }
        else {
          var halfHeight = self.container.find("[data-ss-component='item']").height() / 2;

          self.panCoords = soysauce.getCoords(e2);
          self.panCoords.x -= self.itemWidth/2;
          self.panCoords.x *= -self.scale;
          self.panCoords.y = (e2.originalEvent.changedTouches && e2.originalEvent.changedTouches.length) ? e2.originalEvent.changedTouches[0].pageY : e2.originalEvent.pageY;
          
          offset = self.panCoords.y - ((e2.originalEvent.changedTouches && e2.originalEvent.changedTouches.length) ? e2.originalEvent.changedTouches[0].target.y : e2.originalEvent.target.y);

          if (offset < (self.container.find("[data-ss-component='item']").height() / 2)) {
            offset = Math.abs(offset - halfHeight);
          }
          else {
            offset = halfHeight - offset;
          }

          self.panCoords.y = offset;

          self.checkPanLimits();

          self.panCoordsStart.x = self.panCoords.x;
          self.panCoordsStart.y = self.panCoords.y;
        }

        if (!isNaN(self.panCoords.x) && !isNaN(self.panCoords.y)) {
          self.dots.first().parent().css("visibility", "hidden");
          self.nextBtn.hide();
          self.prevBtn.hide();
          self.isZooming = true;
          self.ready = false;
          self.widget.attr("data-ss-state", "zoomed");
          self.zoomIcon.attr("data-ss-state", "in");
          self.scale = DEFAULT_SCALE;
          self.initPanLimits();
          
          if (self.peek && /left/.test(self.peekAlign)) {
            $(zoomImg).css({
              "position": "relative",
              "left": self.peekWidth + "px"
            });
          }
          
          setMatrix(zoomImg, self.scale, self.panCoords.x, self.panCoords.y);
          
          $(zoomImg).one(TRANSITION_END, function() {
            self.isZoomed = true;
            self.isZooming = false;
          });
        }
      });
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
      this.scale = 1;
      this.widget.off("touchmove mousemove");
      
      if (self.peek && /left/.test(self.peekAlign)) {
        $(zoomImg).css({
          "left": "0px"
        });
      }
      
      setMatrix(zoomImg, this.scale, 0, 0);
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
      if (noZoomTransition) {
        this.isZoomed = false;
        this.isZooming = false;
        $(zoomImg).attr("data-ss-state", "notransition");
      }
      else {
        $(zoomImg).one(TRANSITION_END, function() {
          self.isZoomed = false;
          self.isZooming = false;
        });
      }
      setMatrix(zoomImg, 1, 0, 0);
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
  
  function setMatrix(element, scale, x, y) {
    x = x || 0;
    y = y || 0;
    scale = scale || DEFAULT_SCALE;
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

soysauce.togglers = (function() {
  var TRANSITION_END = "transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd";
  
  // Togglers
  function Toggler(selector, orphan) {
    var self = this;
    var options = soysauce.getOptions(selector);

    // Base
    if (orphan) {
      var button = $(selector);
      var togglerID = button.attr("data-ss-toggler-id");
      var query = "[data-ss-toggler-id='" + togglerID + "']";
      
      this.orphan = true;
      this.widget = $(query);
      
      this.widget.each(function(i, component) {
        var type = $(component).attr("data-ss-component");
        switch (type) {
          case "button":
            self.button = $(component);
            break;
          case "content":
            self.content = $(component);
            break;
        }
      });
      
      if (!this.content) {
        console.warn("Soysauce: No content found for toggler-id '" + togglerID + "'. Toggler may not work.");
        return;
      }
      
      this.button.click(function(e) {
        self.toggle(null, e);
      });
      
      this.setState("closed");
      this.content.attr("data-ss-id", button.attr("data-ss-id"));
    }
    else {
      this.widget = $(selector);
      this.orphan = false;
      this.allButtons = this.widget.find("> [data-ss-component='button']");
      this.button = this.allButtons.first();
      this.allContent = this.widget.find("> [data-ss-component='content']");
      this.content = this.allContent.first();
    }
    
    this.parentID = 0;
    this.tabID;
    this.state = "closed";
    this.isChildToggler = false;
    this.hasTogglers = false;
    this.parent = undefined;
    this.ready = true;
    this.adjustFlag = false;
    this.freeze = false;
    this.opened = false;
    
    // Slide
    this.slide = false;
    this.height = 0;
    this.prevChildHeight = 0;
    
    // Ajax
    this.ajax = false;
    this.ajaxData;
    this.ajaxing = false;
    this.ajaxOnLoad = false;
    
    // Tab
    this.tab = false;
    this.childTabOpen = false;
    this.nocollapse = false;
    
    // Responsive
    this.responsive = false;
    this.responsiveVars = {
      threshold: parseInt(this.widget.attr("data-ss-responsive-threshold"), 10) || 768,
      accordions: true
    };
    
    if (options) options.forEach(function(option) {
      switch(option) {
        case "ajax":
          self.ajax = true;
          self.ajaxOnLoad = /true/.test(self.widget.attr("data-ss-ajax-onload"));
          break;
        case "tabs":
          self.tab = true;
          break;
        case "nocollapse":
          self.nocollapse = true;
          break;
        case "slide":
          self.slide = (soysauce.vars.degrade) ? false : true;
          break;
        case "responsive":
          self.responsive = true;
          self.tab = true;
          break;
      }
    });

    if (this.orphan) {
      this.content.on(TRANSITION_END, function() {
        self.content.trigger("slideEnd");
        self.ready = true;
      });
      return this;
    }

    this.allButtons.append("<span class='icon'></span>");
    this.allContent.wrapInner("<div data-ss-component='wrapper'/>");

    this.hasTogglers = (this.widget.has("[data-ss-widget='toggler']").length > 0) ? true : false; 
    this.isChildToggler = (this.widget.parents("[data-ss-widget='toggler']").length > 0) ? true : false;

    if (this.isChildToggler) {
      var parent = this.widget.parents("[data-ss-widget='toggler']");
      this.parentID = parseInt(parent.attr("data-ss-id"), 10);
      this.parent = soysauce.fetch(this.parentID);
    }

    if (this.widget.attr("data-ss-state") !== undefined && this.widget.attr("data-ss-state") === "open") {
      this.allButtons.each(function() {
        var button = $(this);
        if (!button.attr("data-ss-state"))  {
          button.attr("data-ss-state", "closed");
          button.find("+ [data-ss-component='content']").attr("data-ss-state", "closed");
        }
        else if (button.attr("data-ss-state") === "open") {
          this.button = button;
          this.content = button.find("+ [data-ss-component='content']");
        }
      });
      this.opened = true;
    }
    else {
      this.allButtons.attr("data-ss-state", "closed");
      this.allContent.attr("data-ss-state", "closed");
      this.widget.attr("data-ss-state", "closed");
      this.opened = false;
    }
    
    if (this.slide) {
      this.allContent.attr("data-ss-state", "open");

      if (this.hasTogglers) {
        this.allContent.each(function() {
          var content = $(this);
          content.imagesLoaded(function() {
            var height;
            content.find("[data-ss-component='content']").attr("data-ss-state", "closed");
            height = content.outerHeight(true);
            self.height = height;
            content.attr("data-ss-slide-height", height);
            content.css("height", "0px");
            content.attr("data-ss-state", "closed");
            content.find("[data-ss-component='content']").removeAttr("data-ss-state");
          });
        });
      }
      else {
        this.allContent.each(function() {
          var content = $(this);
          content.imagesLoaded(function() {
            content.attr("data-ss-slide-height", content.outerHeight(true));
            content.css("height", "0px");
            content.attr("data-ss-state", "closed");
          });
        });
      }
      this.allContent.on(TRANSITION_END, function() {
        if (!self.orphan) {
          self.widget.trigger("slideEnd");
        }
        self.ready = true;
      });
    }
    
    this.allButtons.click(function(e) {
      self.toggle(null, e);
    });
    
    if (this.responsive) {
      this.handleResponsive();
    }
    
    if (this.ajax) {
      var obj = this.widget;
      var content = this.widget.find("> [data-ss-component='content'][data-ss-ajax-url]");
      var ajaxButton;
      var url = "";
      var callback;
      var self = this;
      var firstTime = false;
      
      if (content.length === 0) {
        console.warn("Soysauce: 'data-ss-ajax-url' tag required on content. Must be on the same domain if site doesn't support CORS.");
        return;
      }
      
      content.each(function(i, contentItem) {
        ajaxButton = $(contentItem.previousElementSibling);
        if (self.ajaxOnLoad) {
          obj.on("SSWidgetReady", function() {
            injectAjaxContent(self, contentItem);
          });
        }
        else {
          ajaxButton.click(function() {
            injectAjaxContent(self, contentItem);
          });
        }
      });
      
      function injectAjaxContent(self, contentItem) {
        url = $(contentItem).attr("data-ss-ajax-url");
        
        self.setState("ajaxing");
        self.ready = false;
        self.ajaxing = true;
        
        self.ajaxData = soysauce.ajax(url);
        
        self.setAjaxComplete();
      }
    }
    
    if (this.tab && this.nocollapse) {
      this.content.imagesLoaded(function() {
        self.widget.css("min-height", self.button.outerHeight(true) + self.content.outerHeight(true));
      });
    }
  } // End constructor
  
  Toggler.prototype.open = function() {
    var slideOpenWithTab = this.responsiveVars.accordions;

    if (!this.ready && !slideOpenWithTab) return;

    var self = this;
    var prevHeight = 0;

    if (this.slide) {
      if (this.responsive && !slideOpenWithTab) return;

      this.ready = false;

      if (this.adjustFlag || slideOpenWithTab) this.content.one(TRANSITION_END, function() {
        self.adjustHeight();
      });

      if (this.isChildToggler && this.parent.slide) {
        if (this.tab) {
          this.parent.setHeight(this.parent.height + this.height - this.parent.prevChildHeight);
        }
        else {
          this.parent.addHeight(this.height);
        }
        this.parent.prevChildHeight = this.height;
      }

      if (this.ajax && this.height === 0) {
        $(this.content).imagesLoaded(function() {
          self.content.css("height", "auto");
          self.height = self.content.outerHeight(true);
          self.content.css("height", self.height + "px");
        });
      }
      else {
        self.height = parseInt(self.content.attr("data-ss-slide-height"), 10);
        self.content.css("height", self.height + "px");
      }
    }
    
    if (this.tab && this.nocollapse) {
      this.widget.css("min-height", this.button.outerHeight(true) + this.content.outerHeight(true));
    }

    this.opened = true;
    this.setState("open");
  };
  
  Toggler.prototype.close = function(collapse) {
    var self = this;

    if (!this.ready) return;

    if (this.slide) {
      this.ready = false;
      if (this.isChildToggler && this.parent.slide && collapse) {
        this.parent.addHeight(-this.height);
      }
      this.content.css("height", "0px");
    }

    this.setState("closed");
  };
  
  Toggler.prototype.doResize = function() {
    this.adjustFlag = true;
    if (this.opened) {
      this.adjustHeight();
    }
    if (this.responsive) {
      this.handleResponsive();
    }
  };
  
  Toggler.prototype.handleResize = function() {
    var self = this;
    
    if (this.defer) {
      var subWidgets = this.allContent.find("[data-ss-widget]");
      
      this.allContent.css({
        "clear": "both",
        "position": "relative"
      });

      if (!subWidgets.length) {
        this.doResize();
      }
      else {
        subWidgets.each(function(i, e) {
          var widget = soysauce.fetch(e).widget;

          if ((i + 1) !== subWidgets.length) return;
            
          widget.one("SSWidgetResized", function () {
            self.allContent.css({
              "clear": "",
              "position": "",
              "display": ""
            });
            self.doResize();
          });
        });
      }
    }
    else {
      this.doResize();  
    }
  };
  
  Toggler.prototype.adjustHeight = function() {
    if (!this.slide) {
      if (this.tab && this.nocollapse) {
        this.widget.css("min-height", this.button.outerHeight(true) + this.content.outerHeight(true));
      }
      return;
    }
    if (this.opened) {
      this.height = this.content.find("> [data-ss-component='wrapper']").outerHeight(true);
      this.content.attr("data-ss-slide-height", this.height).height(this.height);
    }
  };

  Toggler.prototype.addHeight = function(height) {
    this.height += height;
    this.height = (this.height < 0) ? 0 : this.height;
    if (this.slide) {
      this.content.attr("data-ss-slide-height", this.height);
    }
    this.content.css("height", this.height + "px");
  };

  Toggler.prototype.setHeight = function(height) {
    this.height = height;
    this.height = (this.height < 0) ? 0 : this.height;
    if (this.slide) {
      this.content.attr("data-ss-slide-height", this.height);
    }
    this.content.css("height", this.height + "px");
  };

  Toggler.prototype.toggle = function(component, e) {
    var self = this;
    var target;
    
    if (this.freeze || this.ajaxing) return;

    if (e) {
      target = e.target;
    }
    else {
      if (component && !this.orphan) {
        if (typeof(component) === "string") {
          target = component = this.widget.find(component)[0];
        }
        try {
          if (/content/.test(component.attributes["data-ss-component"].value)) {
            var $component = this.widget.find(component);
            target = component.previousElementSibling;
          }
        }
        catch (e) {
          console.warn("Soysauce: component passed is not a Soysauce component. Opening first toggler.");
          target = this.button[0];
        }
      }
      else {
        target = this.button[0];
        if (target && !target.attributes["data-ss-component"]) {
          console.warn("Soysauce: component passed is not a Soysauce component. Opening first toggler.");
        }
      }
    }

    if (!$(target).attr("data-ss-component")) {
      target = $(target).closest("[data-ss-component='button']")[0];
    }

    if (this.orphan) {
      if (this.opened) {
        this.opened = false;
        this.setState("closed");
      }
      else {
        this.opened = true;
        this.setState("open");
      }
      return;
    }

    if (this.tab) {
      var collapse = (this.button.attr("data-ss-state") === "open" &&
                      this.button[0] === target) ? true : false;

      if ((this.responsive && !this.responsiveVars.accordions || this.nocollapse) && (this.button[0] === target)) return;

      if (this.isChildToggler && this.tab) {
        this.parent.childTabOpen = !collapse;
        if (collapse) {
          this.parent.prevChildHeight = 0;
        }
      }

      this.close(collapse);

      this.button = $(target);
      this.content = $(target).find("+ [data-ss-component='content']");

      if (this.slide) {
        self.height = parseInt(self.content.attr("data-ss-slide-height"), 10);
      }

      if (collapse) {
        this.widget.attr("data-ss-state", "closed");
        this.opened = false;
        return;
      }

      this.open();
    }
    else {
      this.button = $(target);
      this.content = $(target).find("+ [data-ss-component='content']");

      var collapse = (this.button.attr("data-ss-state") === "open" &&
                      this.widget.find("[data-ss-component='button'][data-ss-state='open']").length === 1) ? true : false;
      
      if (collapse) {
        this.opened = false;
      }
      
      (this.button.attr("data-ss-state") === "closed") ? this.open() : this.close();
    }
  };

  Toggler.prototype.setState = function(state) {
    this.state = state;
    this.button.attr("data-ss-state", state);
    this.content.attr("data-ss-state", state);

    if (this.orphan) return;
    
    if (this.opened) {
      this.widget.attr("data-ss-state", "open");
    }
    else {
      this.widget.attr("data-ss-state", "closed");
    }

    if (this.responsive && this.opened) {
      this.handleResponsive();
    }
  };

  Toggler.prototype.setAjaxComplete = function() {
    this.ajaxing = false;
    this.ready = true;
    if (this.opened) {
      this.setState("open");
    }
    else {
      this.setState("closed");
    }
    this.widget.trigger("SSAjaxComplete");
  };

  Toggler.prototype.handleFreeze = function() {
    this.freeze = true;
  };

  Toggler.prototype.handleUnfreeze = function() {
    this.freeze = false;
  };

  Toggler.prototype.handleResponsive = function() {
    if (!this.responsive) return;
    if (window.innerWidth >= this.responsiveVars.threshold) {
      this.responsiveVars.accordions = false;
      this.widget.attr("data-ss-responsive-type", "tabs");
      if (!this.opened) {
        this.button = this.widget.find("[data-ss-component='button']").first();
        this.content = this.widget.find("[data-ss-component='content']").first();
        this.open();
      }
      this.widget.css("min-height", this.button.outerHeight(true) + this.content.outerHeight(true) + "px");
    }
    else {
      this.responsiveVars.accordions = true;
      this.widget.attr("data-ss-responsive-type", "accordions");
      this.widget.css("min-height", "0");
    }
  };
  
  return {
    init: function(selector, orphan) {
      return new Toggler(selector, orphan);
    }
  };
  
})();
