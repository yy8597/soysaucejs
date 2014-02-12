/**
* core.js
*
* The base Soysauce object is instantiated in this file. In addition,
* this is the section where Soyasuce stores internal variables, browser
* information and helper functions.
*
*/

(function(window, $) {
  "use strict";

  /**
  * The core Soysauce object.
  *
  * @module soysauce
  */
  window.soysauce = window.soysauce || {};

  /**
  * An array of all initialized Soysauce widgets.
  *
  * @property widgets
  */
  soysauce.widgets = new Array();

  /**
  * Miscellaneous variables used both internally and externally.
  *
  * @property vars
  */
  soysauce.vars = {
    idCount: 0,
    degradeAll: (/Android ([12]|4\.0)|Opera|SAMSUNG-SGH-I747|SCH-I535/.test(navigator.userAgent)) ? true : false,
    degrade: (/Android ([12]|4\.0)|Opera|SAMSUNG-SGH-I747/.test(navigator.userAgent) && !/SCH-R530U/.test(navigator.userAgent)) ? true : false,
    degrade2: (/SCH-I535/.test(navigator.userAgent)) ? true : false,
    lastResizeTime: 0,
    lastResizeTimerID: 0,
    fastclick: [],
    ajaxQueue: []
  };

  /**
  * Returns an array of options. Used for
  * initializing a widget.
  *
  * @method getOptions
  * @param selector {Element} DOM object in which to obtain options.
  * @return {Array}
  */
  soysauce.getOptions = function(selector) {
    if(!$(selector).attr("data-ss-options")) return false;
    return $(selector).attr("data-ss-options").split(" ");
  };

  /**
  * Returns the vendor prefix for the current browser.
  *
  * @method getPrefix
  * @return {String}
  */
  soysauce.getPrefix = function() {
    if (navigator.userAgent.match(/webkit/i) !== null) return "-webkit-";
    else if (navigator.userAgent.match(/windows\sphone|msie/i) !== null) return "-ms-";
    else if (navigator.userAgent.match(/^mozilla/i) !== null) return "-moz-";
    else if (navigator.userAgent.match(/opera/i) !== null) return "-o-";
    return "";
  };

  /**
  * Prevents default event action.
  * Prevents event propagation.
  * Handles HammerJS events.
  *
  * @method stifle
  * @param e {Event}
  * @param onlyPropagation {Boolean} Default event action will persist if this is set to true.
  */
  soysauce.stifle = function(e, onlyPropagation) {
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
  };

  /**
  * Returns Soysauce widget.
  *
  * @method fetch
  * @param selector {Object} DOM object in which to return; this should point to a widget.
  */
  soysauce.fetch = function(selector) {
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
      if (!widget) return;
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
  };

  /**
  * Helper function that returns coordinates of the touch event.
  * Used for touchstart, touchmove, and touchend.
  *
  * @method getCoords
  * @param e {Event}
  */
  soysauce.getCoords = function(e) {
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
  };

  /**
  * Helper function that returns the array form of a matrix.
  *
  * @method getArrayFromMatrix
  * @return {Array}
  */
  soysauce.getArrayFromMatrix = function(matrix) {
    return matrix.substr(7, matrix.length - 8).split(", ");
  };

  /**
  * Contains useful browser information.
  *
  * @property browser
  */
  soysauce.browser = {
    pageLoad: new Date().getTime(),
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
    getOrientation: function() {
      return (window.orientation !== 0) ? "landscape" : "portrait";
    }
  };

  soysauce.browserInfo = soysauce.browser;

  /**
  * Helper function that scrolls the user to the top of the page.
  *
  * @method scrollTop
  * @return {Array}*/
  soysauce.scrollTop = function() {
    window.setTimeout(function(){
      window.scrollTo(0, 1);
    }, 0);
  };

  /**
  * Listener that scrolls the user to the top of the page.
  *
  * @event window.load
  */
  $(window).load(function() {
    var cachedLazyLoader = soysauce.fetch("[data-ss-widget='lazyloader'][data-ss-options*='cache']");
    if (cachedLazyLoader && cachedLazyLoader.isCached) return;
    if (!$(this).scrollTop()) {
      soysauce.scrollTop();
    }
  });

})(window, jQuery, null);
