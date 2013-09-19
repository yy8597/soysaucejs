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
      if (e.gesture) {
        e.gesture.stopPropagation();
      }
    }
    catch(err) {
      console.log(e);
      console.warn("Soysauce: Error occurred calling soysauce.stifle() " + err.message);
      e.stopPropagation();
      e.propagationStopped = true;
    }
    if (onlyPropagation) return false;
    e.preventDefault();
    if (e.gesture) {
      e.gesture.preventDefault();
    }
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
    }(),
    orientation: function() {
      return (window.orientation !== 0) ? "landscape" : "portrait";
    }(),
    ios7BarsVisible: function() {
      if (!/(ipod|iphone).*(7\.0 mobile)/i.test(navigator.userAgent)) return false;
      if (window.orientation !== 0) {
        return (window.innerHeight < 320);
      }
      else {
        return (window.innerHeight < 529);
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
$(window).on("orientationchange", function(e) {
  if (e.type === "orientationchange") {
    if (soysauce.vars.lastResizeID) clearTimeout(soysauce.vars.lastResizeID);
    soysauce.vars.lastResizeID = window.setTimeout(function() {
      soysauce.vars.lastResizeTime = e.timeStamp;
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
  // Set HammerJS Options
  try {
    Hammer.gestures.Swipe.defaults.swipe_velocity = 0.35;
    Hammer.gestures.Drag.defaults.drag_min_distance = 1;
    Hammer.gestures.Drag.defaults.drag_lock_min_distance = 1;
    Hammer.gestures.Drag.defaults.drag_lock_to_axis = true;
  }
  catch(e) {
    console.warn("Soysauce: Error setting options with HammerJS");
    console.error(e);
  }
  
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
