/*
	FastClick (removes the click delay found on mobile devices).
	More info can be found on https://github.com/ftlabs/fastclick
*/
(function() {
	/**
   * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
   *
   * @version 0.6.4
   * @codingstandard ftlabs-jsv2
   * @copyright The Financial Times Limited [All Rights Reserved]
   * @license MIT License (see LICENSE.txt)
   */

  /*jslint browser:true, node:true*/
  /*global define, Event, Node*/


  /**
   * Instantiate fast-clicking listeners on the specificed layer.
   *
   * @constructor
   * @param {Element} layer The layer to listen on
   */
  function FastClick(layer) {
  	'use strict';
  	var oldOnClick, self = this;


  	/**
  	 * Whether a click is currently being tracked.
  	 *
  	 * @type boolean
  	 */
  	this.trackingClick = false;


  	/**
  	 * Timestamp for when when click tracking started.
  	 *
  	 * @type number
  	 */
  	this.trackingClickStart = 0;


  	/**
  	 * The element being tracked for a click.
  	 *
  	 * @type EventTarget
  	 */
  	this.targetElement = null;


  	/**
  	 * X-coordinate of touch start event.
  	 *
  	 * @type number
  	 */
  	this.touchStartX = 0;


  	/**
  	 * Y-coordinate of touch start event.
  	 *
  	 * @type number
  	 */
  	this.touchStartY = 0;


  	/**
  	 * ID of the last touch, retrieved from Touch.identifier.
  	 *
  	 * @type number
  	 */
  	this.lastTouchIdentifier = 0;


  	/**
  	 * The FastClick layer.
  	 *
  	 * @type Element
  	 */
  	this.layer = layer;

  	if (!layer || !layer.nodeType) {
  		throw new TypeError('Layer must be a document node');
  	}

  	/** @type function() */
  	this.onClick = function() { return FastClick.prototype.onClick.apply(self, arguments); };

  	/** @type function() */
  	this.onMouse = function() { return FastClick.prototype.onMouse.apply(self, arguments); };

  	/** @type function() */
  	this.onTouchStart = function() { return FastClick.prototype.onTouchStart.apply(self, arguments); };

  	/** @type function() */
  	this.onTouchEnd = function() { return FastClick.prototype.onTouchEnd.apply(self, arguments); };

  	/** @type function() */
  	this.onTouchCancel = function() { return FastClick.prototype.onTouchCancel.apply(self, arguments); };

  	if (FastClick.notNeeded()) {
  		return;
  	}

  	// Set up event handlers as required
  	if (this.deviceIsAndroid) {
  		layer.addEventListener('mouseover', this.onMouse, true);
  		layer.addEventListener('mousedown', this.onMouse, true);
  		layer.addEventListener('mouseup', this.onMouse, true);
  	}

  	layer.addEventListener('click', this.onClick, true);
  	layer.addEventListener('touchstart', this.onTouchStart, false);
  	layer.addEventListener('touchend', this.onTouchEnd, false);
  	layer.addEventListener('touchcancel', this.onTouchCancel, false);

  	// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
  	// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
  	// layer when they are cancelled.
  	if (!Event.prototype.stopImmediatePropagation) {
  		layer.removeEventListener = function(type, callback, capture) {
  			var rmv = Node.prototype.removeEventListener;
  			if (type === 'click') {
  				rmv.call(layer, type, callback.hijacked || callback, capture);
  			} else {
  				rmv.call(layer, type, callback, capture);
  			}
  		};

  		layer.addEventListener = function(type, callback, capture) {
  			var adv = Node.prototype.addEventListener;
  			if (type === 'click') {
  				adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
  					if (!event.propagationStopped) {
  						callback(event);
  					}
  				}), capture);
  			} else {
  				adv.call(layer, type, callback, capture);
  			}
  		};
  	}

  	// If a handler is already declared in the element's onclick attribute, it will be fired before
  	// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
  	// adding it as listener.
  	if (typeof layer.onclick === 'function') {

  		// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
  		// - the old one won't work if passed to addEventListener directly.
  		oldOnClick = layer.onclick;
  		layer.addEventListener('click', function(event) {
  			oldOnClick(event);
  		}, false);
  		layer.onclick = null;
  	}
  }


  /**
   * Android requires exceptions.
   *
   * @type boolean
   */
  FastClick.prototype.deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;


  /**
   * iOS requires exceptions.
   *
   * @type boolean
   */
  FastClick.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


  /**
   * iOS 4 requires an exception for select elements.
   *
   * @type boolean
   */
  FastClick.prototype.deviceIsIOS4 = FastClick.prototype.deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


  /**
   * iOS 6.0(+?) requires the target element to be manually derived
   *
   * @type boolean
   */
  FastClick.prototype.deviceIsIOSWithBadTarget = FastClick.prototype.deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);


  /**
   * Determine whether a given element requires a native click.
   *
   * @param {EventTarget|Element} target Target DOM element
   * @returns {boolean} Returns true if the element needs a native click
   */
  FastClick.prototype.needsClick = function(target) {
  	'use strict';
  	var nodeName = target.nodeName.toLowerCase();

  	if (nodeName === 'button' || nodeName === 'input') {

  		// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
  		// Don't send a synthetic click to disabled inputs (issue #62)
  		if ((this.deviceIsIOS && target.type === 'file') || target.disabled) {
  			return true;
  		}		
  	} else if (nodeName === 'label' || nodeName === 'video') {
  		return true;
  	}

  	return (/\bneedsclick\b/).test(target.className);
  };


  /**
   * Determine whether a given element requires a call to focus to simulate click into element.
   *
   * @param {EventTarget|Element} target Target DOM element
   * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
   */
  FastClick.prototype.needsFocus = function(target) {
  	'use strict';
  	switch (target.nodeName.toLowerCase()) {
  	case 'textarea':
  	case 'select':
  		return true;
  	case 'input':
  		switch (target.type) {
  		case 'button':
  		case 'checkbox':
  		case 'file':
  		case 'image':
  		case 'radio':
  		case 'submit':
  			return false;
  		}

  		// No point in attempting to focus disabled inputs
  		return !target.disabled && !target.readOnly;
  	default:
  		return (/\bneedsfocus\b/).test(target.className);
  	}
  };


  /**
   * Send a click event to the specified element.
   *
   * @param {EventTarget|Element} targetElement
   * @param {Event} event
   */
  FastClick.prototype.sendClick = function(targetElement, event) {
  	'use strict';
  	var clickEvent, touch;

  	// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
  	if (document.activeElement && document.activeElement !== targetElement) {
  		document.activeElement.blur();
  	}

  	touch = event.changedTouches[0];

  	// Synthesise a click event, with an extra attribute so it can be tracked
  	clickEvent = document.createEvent('MouseEvents');
  	clickEvent.initMouseEvent('click', true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
  	clickEvent.forwardedTouchEvent = true;
  	targetElement.dispatchEvent(clickEvent);
  };


  /**
   * @param {EventTarget|Element} targetElement
   */
  FastClick.prototype.focus = function(targetElement) {
  	'use strict';
  	var length;

  	if (this.deviceIsIOS && targetElement.setSelectionRange) {
  		length = targetElement.value.length;
  		targetElement.setSelectionRange(length, length);
  	} else {
  		targetElement.focus();
  	}
  };


  /**
   * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
   *
   * @param {EventTarget|Element} targetElement
   */
  FastClick.prototype.updateScrollParent = function(targetElement) {
  	'use strict';
  	var scrollParent, parentElement;

  	scrollParent = targetElement.fastClickScrollParent;

  	// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
  	// target element was moved to another parent.
  	if (!scrollParent || !scrollParent.contains(targetElement)) {
  		parentElement = targetElement;
  		do {
  			if (parentElement.scrollHeight > parentElement.offsetHeight) {
  				scrollParent = parentElement;
  				targetElement.fastClickScrollParent = parentElement;
  				break;
  			}

  			parentElement = parentElement.parentElement;
  		} while (parentElement);
  	}

  	// Always update the scroll top tracker if possible.
  	if (scrollParent) {
  		scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
  	}
  };


  /**
   * @param {EventTarget} targetElement
   * @returns {Element|EventTarget}
   */
  FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
  	'use strict';

  	// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
  	if (eventTarget.nodeType === Node.TEXT_NODE) {
  		return eventTarget.parentNode;
  	}

  	return eventTarget;
  };


  /**
   * On touch start, record the position and scroll offset.
   *
   * @param {Event} event
   * @returns {boolean}
   */
  FastClick.prototype.onTouchStart = function(event) {
  	'use strict';
  	var targetElement, touch, selection;

  	targetElement = this.getTargetElementFromEventTarget(event.target);
  	touch = event.targetTouches[0];

  	if (this.deviceIsIOS) {

  		// Only trusted events will deselect text on iOS (issue #49)
  		selection = window.getSelection();
  		if (selection.rangeCount && !selection.isCollapsed) {
  			return true;
  		}

  		if (!this.deviceIsIOS4) {

  			// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
  			// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
  			// with the same identifier as the touch event that previously triggered the click that triggered the alert.
  			// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
  			// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
  			if (touch.identifier === this.lastTouchIdentifier) {
  				event.preventDefault();
  				return false;
  			}

  			this.lastTouchIdentifier = touch.identifier;

  			// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
  			// 1) the user does a fling scroll on the scrollable layer
  			// 2) the user stops the fling scroll with another tap
  			// then the event.target of the last 'touchend' event will be the element that was under the user's finger
  			// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
  			// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
  			this.updateScrollParent(targetElement);
  		}
  	}

  	this.trackingClick = true;
  	this.trackingClickStart = event.timeStamp;
  	this.targetElement = targetElement;

  	this.touchStartX = touch.pageX;
  	this.touchStartY = touch.pageY;

  	// Prevent phantom clicks on fast double-tap (issue #36)
  	if ((event.timeStamp - this.lastClickTime) < 200) {
  		event.preventDefault();
  	}

  	return true;
  };


  /**
   * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
   *
   * @param {Event} event
   * @returns {boolean}
   */
  FastClick.prototype.touchHasMoved = function(event) {
  	'use strict';
  	var touch = event.changedTouches[0];

  	if (Math.abs(touch.pageX - this.touchStartX) > 10 || Math.abs(touch.pageY - this.touchStartY) > 10) {
  		return true;
  	}

  	return false;
  };


  /**
   * Attempt to find the labelled control for the given label element.
   *
   * @param {EventTarget|HTMLLabelElement} labelElement
   * @returns {Element|null}
   */
  FastClick.prototype.findControl = function(labelElement) {
  	'use strict';

  	// Fast path for newer browsers supporting the HTML5 control attribute
  	if (labelElement.control !== undefined) {
  		return labelElement.control;
  	}

  	// All browsers under test that support touch events also support the HTML5 htmlFor attribute
  	if (labelElement.htmlFor) {
  		return document.getElementById(labelElement.htmlFor);
  	}

  	// If no for attribute exists, attempt to retrieve the first labellable descendant element
  	// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
  	return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
  };


  /**
   * On touch end, determine whether to send a click event at once.
   *
   * @param {Event} event
   * @returns {boolean}
   */
  FastClick.prototype.onTouchEnd = function(event) {
  	'use strict';
  	var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

  	// If the touch has moved, cancel the click tracking
  	if (this.touchHasMoved(event)) {
  		this.trackingClick = false;
  		this.targetElement = null;
  	}

  	if (!this.trackingClick) {
  		return true;
  	}

  	// Prevent phantom clicks on fast double-tap (issue #36)
  	if ((event.timeStamp - this.lastClickTime) < 200) {
  		this.cancelNextClick = true;
  		return true;
  	}

  	this.lastClickTime = event.timeStamp;

  	trackingClickStart = this.trackingClickStart;
  	this.trackingClick = false;
  	this.trackingClickStart = 0;

  	// On some iOS devices, the targetElement supplied with the event is invalid if the layer
  	// is performing a transition or scroll, and has to be re-detected manually. Note that
  	// for this to function correctly, it must be called *after* the event target is checked!
  	// See issue #57; also filed as rdar://13048589 .
  	if (this.deviceIsIOSWithBadTarget) {
  		touch = event.changedTouches[0];
  		targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset);
  	}

  	targetTagName = targetElement.tagName.toLowerCase();
  	if (targetTagName === 'label') {
  		forElement = this.findControl(targetElement);
  		if (forElement) {
  			this.focus(targetElement);
  			if (this.deviceIsAndroid) {
  				return false;
  			}

  			targetElement = forElement;
  		}
  	} else if (this.needsFocus(targetElement)) {

  		// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
  		// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
  		if ((event.timeStamp - trackingClickStart) > 100 || (this.deviceIsIOS && window.top !== window && targetTagName === 'input')) {
  			this.targetElement = null;
  			return false;
  		}

  		this.focus(targetElement);

  		// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
  		if (!this.deviceIsIOS4 || targetTagName !== 'select') {
  			this.targetElement = null;
  			event.preventDefault();
  		}

  		return false;
  	}

  	if (this.deviceIsIOS && !this.deviceIsIOS4) {

  		// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
  		// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
  		scrollParent = targetElement.fastClickScrollParent;
  		if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
  			return true;
  		}
  	}

  	// Prevent the actual click from going though - unless the target node is marked as requiring
  	// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
  	if (!this.needsClick(targetElement)) {
  		event.preventDefault();
  		this.sendClick(targetElement, event);
  	}

  	return false;
  };


  /**
   * On touch cancel, stop tracking the click.
   *
   * @returns {void}
   */
  FastClick.prototype.onTouchCancel = function() {
  	'use strict';
  	this.trackingClick = false;
  	this.targetElement = null;
  };


  /**
   * Determine mouse events which should be permitted.
   *
   * @param {Event} event
   * @returns {boolean}
   */
  FastClick.prototype.onMouse = function(event) {
  	'use strict';

  	// If a target element was never set (because a touch event was never fired) allow the event
  	if (!this.targetElement) {
  		return true;
  	}

  	if (event.forwardedTouchEvent) {
  		return true;
  	}

  	// Programmatically generated events targeting a specific element should be permitted
  	if (!event.cancelable) {
  		return true;
  	}

  	// Derive and check the target element to see whether the mouse event needs to be permitted;
  	// unless explicitly enabled, prevent non-touch click events from triggering actions,
  	// to prevent ghost/doubleclicks.
  	if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

  		// Prevent any user-added listeners declared on FastClick element from being fired.
  		if (event.stopImmediatePropagation) {
  			event.stopImmediatePropagation();
  		} else {

  			// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
  			event.propagationStopped = true;
  		}

  		// Cancel the event
  		event.stopPropagation();
  		event.preventDefault();

  		return false;
  	}

  	// If the mouse event is permitted, return true for the action to go through.
  	return true;
  };


  /**
   * On actual clicks, determine whether this is a touch-generated click, a click action occurring
   * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
   * an actual click which should be permitted.
   *
   * @param {Event} event
   * @returns {boolean}
   */
  FastClick.prototype.onClick = function(event) {
  	'use strict';
  	var permitted;

  	// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
  	if (this.trackingClick) {
  		this.targetElement = null;
  		this.trackingClick = false;
  		return true;
  	}

  	// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
  	if (event.target.type === 'submit' && event.detail === 0) {
  		return true;
  	}

  	permitted = this.onMouse(event);

  	// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
  	if (!permitted) {
  		this.targetElement = null;
  	}

  	// If clicks are permitted, return true for the action to go through.
  	return permitted;
  };


  /**
   * Remove all FastClick's event listeners.
   *
   * @returns {void}
   */
  FastClick.prototype.destroy = function() {
  	'use strict';
  	var layer = this.layer;

  	if (this.deviceIsAndroid) {
  		layer.removeEventListener('mouseover', this.onMouse, true);
  		layer.removeEventListener('mousedown', this.onMouse, true);
  		layer.removeEventListener('mouseup', this.onMouse, true);
  	}

  	layer.removeEventListener('click', this.onClick, true);
  	layer.removeEventListener('touchstart', this.onTouchStart, false);
  	layer.removeEventListener('touchend', this.onTouchEnd, false);
  	layer.removeEventListener('touchcancel', this.onTouchCancel, false);
  };


  FastClick.notNeeded = function() {
  	'use strict';
  	var metaViewport;

  	// Devices that don't support touch don't need FastClick
  	if (typeof window.ontouchstart === 'undefined') {
  		return true;
  	}

  	if ((/Chrome\/[0-9]+/).test(navigator.userAgent)) {

  		// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
  		if (FastClick.prototype.deviceIsAndroid) {
  			metaViewport = document.querySelector('meta[name=viewport]');
  			if (metaViewport && metaViewport.content.indexOf('user-scalable=no') !== -1) {
  				return true;
  			}

  		// Chrome desktop doesn't need FastClick (issue #15)
  		} else {
  			return true;
  		}
  	}

  	return false;
  };


  /**
   * Factory method for creating a FastClick object
   *
   * @param {Element} layer The layer to listen on
   */
  FastClick.attach = function(layer) {
  	'use strict';
  	return new FastClick(layer);
  };

  if (typeof define !== 'undefined' && define.amd) {

  	// AMD. Register as an anonymous module.
  	define(function() {
  		'use strict';
  		return FastClick;
  	});
  } else if (typeof module !== 'undefined' && module.exports) {
  	module.exports = FastClick.attach;
  	module.exports.FastClick = FastClick;
  } else {
  	window.FastClick = FastClick;
  }
  
  window.addEventListener("load", function() {
      new FastClick(document.body);
  }, false);
  
})();

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
		degrade: (/Android [12]|Opera/.test(navigator.userAgent)) ? true : false,
		lastResizeTime: 0,
		lastResizeTimerID: 0
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
	stifle: function(e) {
		if (!e) return false;
		e.stopImmediatePropagation();
		e.preventDefault();
	},
	fetch: function(selector) {
		var query, ret;
		
		if (!selector) return false;
		
		if (typeof(selector) === "object") {
			selector = parseInt($(selector).attr("data-ss-id"));
		}
		
		if (typeof(selector) === "string") {
			var val = parseInt($(selector).attr("data-ss-id"));;

			if (isNaN(val)) {
				val = parseInt(selector);
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
		userAgent: navigator.userAgent,
		supportsSVG: (document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")) ? true : false,
		supportsLocalStorage: (typeof(window.localStorage) !== "undefined") ? true : false,
		supportsSessionStorage: (typeof(window.sessionStorage) !== "undefined") ? true : false,
		sessionStorageFull: false
	},
	scrollTop: function() {
		window.setTimeout(function(){
			window.scrollTo(0, 1);
		}, 0);
	}
}

// Widget Resize Handler
$(window).on("resize orientationchange", function(e) {
	if ((e.type === "orientationchange" || window.innerWidth !== soysauce.vars.currentViewportWidth) &&
	    (e.timeStamp - soysauce.vars.lastResizeTime > 30)) {
	  if (soysauce.vars.lastResizeID) clearTimeout(soysauce.vars.lastResizeID);
	  soysauce.vars.lastResizeID = window.setTimeout(function() {
	    soysauce.vars.lastResizeTime = e.timeStamp;
  		soysauce.vars.currentViewportWidth = window.innerWidth;
  		soysauce.widgets.forEach(function(widget) {
  			if (!widget.handleResize) return;
  			widget.handleResize();
  			if (widget.type === "Carousel") {
  			  if (widget.itemWidth) {
  			    $(widget.widget).trigger("SSWidgetResized");
  			  }
  			}
  			else {
  			  $(widget.widget).trigger("SSWidgetResized");
  			}
  		});
	  }, 250);
	}
});

// Widget Initialization
$(document).ready(function() {
	soysauce.scrollTop();
	soysauce.init();
	if (soysauce.vars.degrade) {
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

}

soysauce.freezeChildren = function(selector) {
	var children = $("[data-ss-id='" + selector + "']").find("[data-ss-widget]");
	children.each(function(index, child) {
		var id = $(child).attr("data-ss-id");
		soysauce.freeze(id, false);
	});
};

soysauce.freeze = function(selector, freezeChildren) {
	if (typeof(selector) === "object") {
		selector = parseInt($(selector).attr("data-ss-id"));
	}
	freezeChildren = (freezeChildren === undefined) ? true : false;
	soysauce.fetch(selector).handleFreeze();
	if (freezeChildren) {
		soysauce.freezeChildren(selector);
	}
};

soysauce.unfreeze = function(selector) {
	if (typeof(selector) === "object") {
		selector = parseInt($(selector).attr("data-ss-id"));
	}
	var children = $("[data-ss-id='" + selector + "']").find("[data-ss-widget]");
	soysauce.fetch(selector).handleUnfreeze();
	children.each(function(index, child) {
		var id = $(child).attr("data-ss-id");
		soysauce.fetch(id).handleUnfreeze();
	});
};

soysauce.init = function(selector) {
	var set;
	var numItems = 0;
	var ret = false;
	
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
		
		$this.attr("data-ss-id", ++soysauce.vars.idCount);
		
		if (!type && $this.attr("data-ss-toggler-id") !== undefined) {
			type = "toggler";
			orphan = true;
		}
		
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
			soysauce.widgets.push(widget);
			if ($this.attr("data-ss-defer") !== undefined) {
				widget.defer = true;
			}
			else {
				$this.imagesLoaded(function() {
					widget.initialized = true;
					$this.trigger("SSWidgetReady");
				});
				ret = true;
			}
		}
		else {
			$this.removeAttr("data-ss-id");
			--soysauce.vars.idCount;
		}
		
	});
	
	return ret;
}

soysauce.lateload = function(selector) {
	
	function loadItem(selector) {
		var curr = $(selector);
		var val = curr.attr("data-ss-ll-src");
		if (val) {
			curr.attr("src", val).removeAttr("data-ss-ll-src");
			return true;
		}
		return false;
	}
	
	if (selector) {
		return loadItem(selector);
	}
	else {
		$(document).on("DOMContentLoaded", function() {
			$("[data-ss-ll-src][data-ss-options='dom']").each(function(i, e) {
				loadItem(e);
			});
		});
		$(window).on("load", function() {
			if (!$("[data-ss-ll-src][data-ss-options='load']")) return;
			$("[data-ss-ll-src][data-ss-options='load']").each(function(i, e) {
				loadItem(e);
			});
		});
	}
};

soysauce.lateload();

soysauce.overlay = (function() {
	var overlay, done, caption;
	var init = true;
	var isOn = false;

	return {
		init: function(selector) {
			var div = document.createElement("div");
			
			if (!init) return false;
			
			div.setAttribute("data-ss-utility", "overlay");
			div.setAttribute("data-ss-state", "inactive");
			document.body.appendChild(div);
			
			overlay = $("[data-ss-utility='overlay']");
			
			overlay.append("<span class='done'></span>");
			done = overlay.find(".done");
			
			overlay.append("<div class='caption'></span>");
			caption = overlay.find(".caption");
			
			done.on("click", function() {
				soysauce.overlay.off();
			});
			
			init = false;
		},
		on: function() {
			if (isOn) return;
			overlay.show();
			window.setTimeout(function() {
				overlay.attr("data-ss-state","active");
				overlay.trigger("SSOverlayOn");
				isOn = true;
			}, 0);
		},
		off: function() {
			if (!isOn) return;
			overlay.attr("data-ss-state","inactive");
			window.setTimeout(function() {
				overlay.hide();
				overlay.trigger("SSOverlayOff");
				isOn = false;
			}, 400);
		},
		toggle: function() {
			if (isOn) {
				soysauce.overlay.off();
			}
			else {
				soysauce.overlay.on();
			}
		},
		state: function() {
			if (isOn) {
				return "on";
			}
			else {
				return "off";
			}
		},
		caption: function(text) {
			if (!text) {
				caption.html("");
			}
			else {
				caption.html(text);
			}
		}
	};

})();

soysauce.overlay.init();
soysauce.autodetectCC = (function() {
	
	function autodetectCC(selector) {
		var options = soysauce.getOptions(selector);
		var self = this;
		
		this.type = "Autodetect-CC";
		this.widget = $(this);
		this.id = parseInt($(selector).attr("data-ss-id"));
		this.input = $(selector);
		this.prediction;
		this.result;
		this.format = false;
		
		if (options) options.forEach(function(option) {
			switch(option) {
				case "format":
					self.format = true;
					break;
			}
		});
		
		if (this.format) {
			this.input.attr("maxlength", "19");
		}
		else {
			this.input.attr("maxlength", "16");
		}
		
		if (this.format && soysauce.vars.degrade) {
			this.input.on("keydown", function(e) {
				var keycode = e.keyCode ? e.keyCode : e.which;
				if (keycode !== 8 && keycode !== 46 && keycode !== 91 && keycode !== 17 && keycode !== 189) {
					soysauce.stifle(e);
					self.input.val(this.value + String.fromCharCode(e.keyCode));
				}
			});
		}
		
		this.input.on("keyup change", function(e) {
			var card_num = e.target.value.replace(/[-\s]+/g, "");
			var keycode = e.keyCode ? e.keyCode : e.which;
			
			// State 1 - Prediction
			if (card_num.length < 4) {
				if (card_num.match(/^4/)) {
					self.prediction = "visa";
				} 
				else if (card_num.match(/^5/)) {
					self.prediction = "mastercard";
				} 
				else if (card_num.match(/^6/)) {
					self.prediction = "discover";
				} 
				else if (card_num.match(/^3/)) {
					if (card_num.length === 1) {
						self.prediction = "amex dinersclub jcb";
					}
					else {
						if (card_num.match(/^3(4|7)/)) {
							self.prediction = "amex";
						}
						else if (card_num.match(/^3(0|8)/)) {
							self.prediction = "dinersclub";
						}
						else if (card_num.match(/^35/)) {
							self.prediction = "jcb";
						}
					}
				}
				else {
					self.prediction = undefined;
				}
				$(e.target).trigger("SSPrediction");
			} 
			else if (card_num.length === 0) {
				self.prediction = undefined;
			}

			// State 2 - Result
			if (card_num.length > 12 && validCC(card_num)) {
				if (card_num.match(/^4[0-9]{12}(?:[0-9]{3})?$/)) {
					self.result = "visa";
					$(e.target).trigger("SSResult");
				} else if (card_num.match(/^5[1-5][0-9]{14}$/)) {
					self.result = "mastercard";
					$(e.target).trigger("SSResult");
				} else if (card_num.match(/^3[47][0-9]{13}$/)) {
					self.result = "amex";
					$(e.target).trigger("SSResult");
				} else if (card_num.match(/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/)) {
					self.result = "dinersclub";
					$(e.target).trigger("SSResult");
				} else if (card_num.match(/^6(?:011|5[0-9]{2})[0-9]{12}$/)) {
					self.result = "discover";
					$(e.target).trigger("SSResult");
				} else if (card_num.match(/^(?:2131|1800|35\d{3})\d{11}$/)) {
					self.result = "jcb";
					$(e.target).trigger("SSResult");
				} else {
					self.result = undefined;
					$(e.target).trigger("SSResult");
				}
			}
			else {
				var resultChanged = (self.result !== undefined) ? true : false;
				self.result = undefined;
				if (self.prediction === "visa" && card_num.length === 16 ||
						self.prediction === "mastercard" && card_num.length === 16 ||
						self.prediction === "amex" && card_num.length === 15 ||
						self.prediction === "dinersclub" && card_num.length === 16 ||
						self.prediction === "discover" && card_num.length === 14 ||
						self.prediction === "jcb" && card_num.length === 16 ||
						!self.prediction && card_num.length === 16 || resultChanged) {
					$(e.target).trigger("SSResult");
				}
			}
			
			// keycodes: 8 = backspace, 46 = delete, 91 = command, 17 = ctrl, 189 = dash
			if (self.format && card_num.length > 3 && 
				keycode !== 8 && keycode !== 46 && keycode !== 91 && keycode !== 17 && keycode !== 189) {
				self.formatInput(e);
			}
			
		});
	}
	
	autodetectCC.prototype.formatInput = function(e) {
		var val = this.input.val().replace(/[\s]+/g, "");
		var isAmex = (/^3[47]/.test(val.replace(/[-\s]+/g, ""))) ? true : false;
		var isDC = (/^3(?:0[0-5]|[68][0-9])/.test(val.replace(/[-\s]+/g, "")) && !isAmex) ? true : false;
		
		if (soysauce.vars.degrade) {
			setCursorToEnd(this.input[0]);
		}
		
		if (isAmex || isDC) {
			if (val[4] !== undefined && val[4] !== "-") {
				val = insertStringAt("-", 4, val);
				this.input.val(val);
			}
			if (val[11] !== undefined && val[11] !== "-") {
				val = insertStringAt("-", 11, val);
				this.input.val(val);
			}
		}
		else {
			if (val[4] !== undefined && val[4] !== "-") {
				val = insertStringAt("-", 4, val);
				this.input.val(val);
			}
			if (val[9] !== undefined && val[9] !== "-") {
				val = insertStringAt("-", 9, val);
				this.input.val(val);
			}
			if (val[14] !== undefined && val[14] !== "-") {
				val = insertStringAt("-", 14, val)
				this.input.val(val);
			}
		}
		
		function insertStringAt(content, index, dest) {
			if (index > 0) {
				return dest.substring(0, index) + content + dest.substring(index, dest.length);
			}
			else {
				return content + dest;
			}
		}
	};
	
	function setCursorToEnd(input) {
		var index = input.length;
		input.setSelectionRange(19, 19);
	}
	
	// Luhn Algorithm, Copyright (c) 2011 Thomas Fuchs, http://mir.aculo.us
	// https://gist.github.com/madrobby/976805
	function validCC(a,b,c,d,e){for(d=+a[b=a.length-1],e=0;b--;)c=+a[b],d+=++e%2?2*c%10+(c>4):c;return!(d%10)};
	
	return {
		init: function(selector) {
			return new autodetectCC(selector);
		}
	};
	
})();

soysauce.autofillZip = (function() {
	var BASE_URL = "//jeocoder.herokuapp.com/zips/";
	var AOL_URL = "//www.mapquestapi.com/geocoding/v1/reverse?key=Fmjtd%7Cluub2l6tnu%2Ca5%3Do5-96tw0f";
	
	function autofillZip(selector) {
		var options = soysauce.getOptions(selector);
		var self = this;
		
		this.type = "Autofill-Zip";
		this.widget = $(selector);
		this.id = parseInt($(selector).attr("data-ss-id"));
		this.zip = this.widget.find("[data-ss-component='zip']");
		this.city = this.widget.find("[data-ss-component='city']");
		this.state = this.widget.find("[data-ss-component='state']");
		this.lastRequestedData;
		this.freeze = false;
		
		// Reverse Geocode Variables
		this.reverse = false;
		this.reverseGeocodeButton = this.widget.find("[data-ss-component='reverse-geocode']");
		
		if (options) options.forEach(function(option) {
			switch(option) {
				case "reverse":
					self.reverse = true;
					break;
			}
		});
		
		if (this.reverse) {
			this.reverseGeocodeButton.on("click", function() {
				self.reverseGeocode();
			});
		}
		else {
			this.zip.on("keyup change", function() {
				self.getLocationData();
			});
		}
	}
	
	autofillZip.prototype.reverseGeocode = function() {
		var self = this;
		if (!navigator.geolocation || this.freeze) return;
		
		self.widget.trigger("SSDataFetch");
		
		navigator.geolocation.getCurrentPosition(function(data) {
			var src = AOL_URL + "&lat=" + data.coords.latitude + "&lng=" + data.coords.longitude + "&callback=soysauce.fetch(" + self.id + ").setLocationData";
			$("body").append("<script src='" + src + "'></script>");
		});
	};
	
	autofillZip.prototype.setLocationData = function(data) {
		var self = this;
		var city = data.city;
		var state = data.state;
		
		if (this.freeze) return;
		
		this.lastRequestedData = data;
		this.widget.trigger("SSDataReady");

		if (this.reverse) {
			this.zip.val(data.results[0].locations[0].postalCode);
		}
		else {
			this.city.val(city);
			this.state.val(state);
		}
	};
	
	autofillZip.prototype.getLocationData = function() {
		var self = this;
		var value = this.zip[0].value;
		
		if (this.freeze) return;
		
		if ((value.length === 5) && (parseFloat(value) == parseInt(value)) && !isNaN(value))  {
			this.widget.trigger("SSDataFetch");
			$.ajax({
				dataType: "json",
				url: BASE_URL + value,
				success: function(data) {
					self.setLocationData(data);
				},
				error: function() {
					self.widget.trigger("SSDataError");
					console.warn("Soysauce: Could not fetch zip code " + value);
				}
			});
		}
	};
	
	autofillZip.prototype.handleFreeze = function() {
		this.freeze = true;
	};
	
	autofillZip.prototype.handleUnfreeze = function() {
		this.freeze = false;
	};
	
	return {
		init: function(selector) {
			return new autofillZip(selector);
		}
	};
	
})();

soysauce.autosuggest = (function() {

	function AutoSuggest(selector) {
		var options = soysauce.getOptions(selector);
		var self = this;

    this.type = "Autosuggest";
		this.widget = $(selector);
		this.id = parseInt(this.widget.attr("data-ss-id"));
		this.input = $(selector);
		
		if (options)
			options.forEach(function(option) {
				switch (option) {
					case "option1":
						break;
				}
			});

		var defaults = {  
			url: undefined,
			data: undefined,
			minCharacters: 1,
			maxResults: 10,
			wildCard: '',
			caseSensitive: false,
			notCharacter: '!',
			maxHeight: 350,
			highlightMatches: true,
			onSelect: undefined,
			width: undefined,
			property: 'text'
		};
		this.acSettings = defaults//$.extend(defaults, options);  
		
		
		this.obj = $(selector);
		this.wildCardPatt = new RegExp(self.regexEscape(this.acSettings.wildCard || ''),'g')
		this.results = $('<ul />');
		this.currentSelection = undefined;
		this.pageX =undefined;
		this.pageY =undefined;
		this.getJSONTimeout = 0;
		
		// Prepare the input box to show suggest results by adding in the events
		// that will initiate the search and placing the element on the page
		// that will show the results.
		$(this.results).addClass('jsonSuggest ui-autocomplete ui-menu ui-widget ui-widget-content ui-corner-all').
			attr('role', 'listbox').
			css({
				'xtop': (this.obj.position().top + this.obj.outerHeight()) + 'px',
				'xleft': this.obj.position().left + 'px',
				'width': this.acSettings.width || (this.obj.outerWidth() + 'px'),
				'z-index': 1000000,
				'position':'absolute',
				'background-color': 'black'
			}).hide();
		
		
		this.obj.after(this.results).
			keyup(function (e){
				switch (e.keyCode) {
					case 13: // return key
						$(self.currentSelection).trigger('click');
						return false;
					case 40: // down key
						if (typeof self.currentSelection === 'undefined') {
							self.currentSelection = $('li:first', self.results).get(0);
						}
						else {
							self.currentSelection = $(self.currentSelection).next().get(0);
						}

						self.setHoverClass(self.currentSelection);
						if (self.currentSelection) {
							$(self.results).scrollTop(self.currentSelection.offsetTop);
						}

						return false;
					case 38: // up key
						if (typeof self.currentSelection === 'undefined') {
							self.currentSelection = $('li:last', self.results).get(0);
						}
						else {
							self.currentSelection = $(self.currentSelection).prev().get(0);
						}

						self.setHoverClass(self.currentSelection);
						if (self.currentSelection) {
							$(self.results).scrollTop(self.currentSelection.offsetTop);
						}

						return false;
					default:
						self.runSuggest.apply(this, [e, self]);
				}
			}).
			keydown(function(e) {
				// for tab/enter key
				if ((e.keyCode === 9 || e.keyCode === 13) && self.currentSelection) {
					$(self.currentSelection).trigger('click');
					return true;
				}
			}).
			blur(function(e) {
				// We need to make sure we don't hide the result set
				// if the input blur event is called because of clicking on
				// a result item.
				var resPos = $(self.results).offset();
				resPos.bottom = resPos.top + $(self.results).height();
				resPos.right = resPos.left + $(self.results).width();

				if (pageY < resPos.top || pageY > resPos.bottom || pageX < resPos.left || pageX > resPos.right) {
					$(self.results).hide();
				}
			}).
			focus(function(e) {
				$(this.results).css({
					'top': (self.obj.position().top + self.obj.outerHeight()) + 'px',
					'left': self.obj.position().left + 'px'
				});

				if ($('li', self.results).length > 0) {
					$(self.results).show();
				}
			}).
			attr('autocomplete', 'off');
		
		
		$(window).mousemove(function(e) {
			this.pageX = e.pageX;
			this.pageY = e.pageY;
		});
		
		
		// Escape the not character if present so that it doesn't act in the regular expression
		this.acSettings.notCharacter = self.regexEscape(this.acSettings.notCharacter || '');

		//if we have a url for json, grab it and parse
		if (this.widget.attr("data-ss-suggest-json-file"))
		$.ajax({
			url: this.widget.attr("data-ss-suggest-json-file"),
			dataType: 'json',
			async: false,
			success: function(data) {
				self.acSettings.data = data;
			}
		});

		// Make sure the JSON data is a JavaScript object if given as a string.
		if (this.acSettings.data && typeof this.acSettings.data === 'string') {
			this.acSettings.data = $.parseJSON(this.acSettings.data);
		}
		
		$(this.obj).trigger("SSLoaded");
	};

	AutoSuggest.prototype.handleResize = function() {
		// Placeholder - required soysauce function
	};
	
	/**
	* Escape some text so that it can be used inside a regular expression
	* without implying regular expression rules iself. 
	*/
	AutoSuggest.prototype.regexEscape = function(txt, omit) {
		var specials = ['/', '.', '*', '+', '?', '|',
						'(', ')', '[', ']', '{', '}', '\\'];

		if (omit) {
			for (var i = 0; i < specials.length; i++) {
				if (specials[i] === omit) { specials.splice(i,1); }
			}
		}

		var escapePatt = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
		return txt.replace(escapePatt, '\\$1');
	}
	
	/**
	* When an item has been selected then update the input box,
	* hide the results again and if set, call the onSelect function.
	*/
	AutoSuggest.prototype.selectResultItem = function(item) {
		this.obj.val(item[this.acSettings.property]);
		this.widget.trigger("SSAutoSuggested", {
			suggestion: item
		});
		$(this.results).html('').hide();

		if (typeof this.acSettings.onSelect === 'function') {
			this.acSettings.onSelect(item);
		}
	}
	
	/**
	* Used to get rid of the hover class on all result item elements in the
	* current set of results and add it only to the given element. We also
	* need to set the current selection to the given element here.
	*/
	AutoSuggest.prototype.setHoverClass = function(el) {
		$('li a', this.results).removeClass('ui-state-hover');
		if (el) {
			$('a', el).addClass('ui-state-hover');
		}

		this.currentSelection = el;
	}
	
	/**
	* Build the results HTML based on an array of objects that matched
	* the search criteria, highlight the matches if that feature is turned 
	* on in the settings.
	*/
	AutoSuggest.prototype.buildResults = function(resultObjects, filterTxt) {
		filterTxt = '(' + filterTxt + ')';
		
		var saveSelf = this;

		var bOddRow = true, i, iFound = 0,
			filterPatt = this.acSettings.caseSensitive ? new RegExp(filterTxt, 'g') : new RegExp(filterTxt, 'ig');

		$(this.results).html('').hide();

		for (i = 0; i < resultObjects.length; i += 1) {
			var item = $('<li />'),
				text = resultObjects[i][this.acSettings.property];

			if (this.acSettings.highlightMatches === true) {
				text = text.replace(filterPatt, '<strong>$1</strong>');
			}

			$(item).append('<a class="ui-corner-all">' + text + '</a>');

			if (typeof resultObjects[i].image === 'string') {
				$('>a', item).prepend('<img src="' + resultObjects[i].image + '" />');
			}

			if (typeof resultObjects[i].extra === 'string') {
				$('>a', item).append('<small>' + resultObjects[i].extra + '</small>');
			}

			
			$(item).addClass('ui-menu-item').
				addClass((bOddRow) ? 'odd' : 'even').
				attr('role', 'menuitem').
				click((function(n) { return function() {
					saveSelf.selectResultItem(resultObjects[n]);						
				};})(i)).
				mouseover((function(el) { return function() { 
					saveSelf.setHoverClass(el); 
				};})(item));

			$(this.results).append(item);

			bOddRow = !bOddRow;

			iFound += 1;
			if (typeof this.acSettings.maxResults === 'number' && iFound >= this.acSettings.maxResults) {
				break;
			}
		}

		if ($('li', this.results).length > 0) {
			this.currentSelection = undefined;
			$(this.results).show().css('height', 'auto');

			if ($(this.results).height() > this.acSettings.maxHeight) {
				$(this.results).css({'overflow': 'auto', 'height': this.acSettings.maxHeight + 'px'});
			}
		}
	}
	
	/**
	* Prepare the search data based on the settings for this plugin,
	* run a match against each item in the possible results and display any 
	* results on the page allowing selection by the user.
	*/
	AutoSuggest.prototype.runSuggest = function(e, self) {	
		var search = function(searchData) {
			if (this.value.length < self.acSettings.minCharacters) {
				self.clearAndHideResults();
				return false;
			}

			var resultObjects = [],
				filterTxt = (!self.acSettings.wildCard) ? self.regexEscape(this.value) : self.regexEscape(this.value, self.acSettings.wildCard).replace(wildCardPatt, '.*'),
				bMatch = true, 
				filterPatt, i;

			if (self.acSettings.notCharacter && filterTxt.indexOf(self.acSettings.notCharacter) === 0) {
				filterTxt = filterTxt.substr(self.acSettings.notCharacter.length,filterTxt.length);
				if (filterTxt.length > 0) { bMatch = false; }
			}
			filterTxt = filterTxt || '.*';
			filterTxt = self.acSettings.wildCard ? '^' + filterTxt : filterTxt;
			filterPatt = self.acSettings.caseSensitive ? new RegExp(filterTxt) : new RegExp(filterTxt, 'i');

			// Look for the required match against each single search data item. When the not
			// character is used we are looking for a false match. 
			for (i = 0; i < searchData.length; i += 1) {
				if (filterPatt.test(searchData[i][self.acSettings.property]) === bMatch) {
					resultObjects.push(searchData[i]);
				}
			}

			self.buildResults(resultObjects, filterTxt);
		};

		if (self.acSettings.data && self.acSettings.data.length) {
			search.apply(this, [self.acSettings.data, self]);
		}
		else if (self.acSettings.url && typeof self.acSettings.url === 'string') {
			var text = this.value;
			if (text.length < self.acSettings.minCharacters) {
				self.clearAndHideResults();
				return false;
			}

			$(self.results).html('<li class="ui-menu-item ajaxSearching"><a class="ui-corner-all">Searching...</a></li>').
				show().css('height', 'auto');

			self.getJSONTimeout = window.clearTimeout(self.getJSONTimeout);
			self.getJSONTimeout = window.setTimeout(function() {
				$.getJSON(self.acSettings.url, {search: text}, function(data) {
					if (data) {
						self.buildResults(data, text);
					}
					else {
						self.clearAndHideResults();
					}
				});
			}, 500);
		}
	}
	
	/**
	* Clears any previous results and hides the result list
	*/
	AutoSuggest.prototype.clearAndHideResults = function() {
		$(this.results).html('').hide();
	}

	return {
		init: function(selector) {
			return new AutoSuggest(selector);
		}
	};

})();
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
		this.type = "Carousel";
		this.widget = $(selector);
		this.id = parseInt($(selector).attr("data-ss-id"));
		this.index = 0;
		this.maxIndex;
		this.container;
		this.items;
		this.dots;
		this.numChildren = 0;
		this.itemWidth = 0;
		this.offset = 0;
		this.spacingOffset = 0;
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
			this.zoomMin = (!this.widget.attr("data-ss-zoom-min")) ? 1.2 : parseFloat(this.widget.attr("data-ss-zoom-min"));
			this.zoomMax = (!this.widget.attr("data-ss-zoom-max")) ? 4 : parseFloat(this.widget.attr("data-ss-zoom-max"));
			
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
			this.multiVars.numItems = (!numItems) ? 2 : numItems;
			var minWidth = parseInt(this.widget.attr("data-ss-multi-min-width"));
			this.multiVars.minWidth = (!minWidth) ? 0 : minWidth;
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
		
		this.links = ((items[0].tagName.match(/^a$/i) !== null && items[0].tagName.match(/^a$/i) !== undefined) || items.find("a[href]").length > 0) ? true : false;

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
			this.peekAlign = (!this.widget.attr("data-ss-peek-align")) ? "center" : this.widget.attr("data-ss-peek-align");
			this.peekWidth = (!this.widget.attr("data-ss-peek-width")) ? PEEK_WIDTH : parseInt(this.widget.attr("data-ss-peek-width"));
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
			var padding = parseInt(firstItem.css("padding-left")) + parseInt(firstItem.css("padding-right"));
			var margin = parseInt(firstItem.css("margin-left")) + parseInt(firstItem.css("margin-right"));
			
			self.spacingOffset = 0; // remove this for now
			
			if (self.multi) {
				var widgetWidth = $(self.widget).find('[data-ss-component="container_wrapper"]').innerWidth();
				if (self.multiVars.minWidth>0) {
					self.multiVars.numItems = Math.floor(widgetWidth / self.multiVars.minWidth);
				}
				self.itemWidth = widgetWidth / self.multiVars.numItems;
			}
			else {
				self.itemWidth = self.widget.width();
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
				var zoomMultiplier = self.widget.attr("data-ss-zoom-multiplier");
				self.zoomMultiplier = (!zoomMultiplier) ? ZOOM_MULTIPLIER : parseInt(zoomMultiplier);
				self.panMax.x = (self.itemWidth - self.peekWidth*2) / self.zoomMultiplier;				
				self.panMax.y = self.items.first().height() / self.zoomMultiplier;
				self.panMaxOriginal.x = self.panMax.x;
				self.panMaxOriginal.y = self.panMax.y;
				if (self.panMax.y === 0) {
					self.container.imagesLoaded(function() {
						self.panMax.y = self.items.last().height / self.zoomMultiplier;
						self.panMaxOriginal.y = self.panMax.y;
					});
				}
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
						self.offset = -self.index*self.itemWidth + self.peekWidth + self.spacingOffset;
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
						self.offset = -self.itemWidth + self.peekWidth + self.spacingOffset;
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
				self.offset = -self.index*self.itemWidth + (self.peekWidth) + self.spacingOffset;
			}
			else if (self.index === 1) {
				self.offset = -self.itemWidth + (self.peekWidth) + self.spacingOffset;
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
						self.gotoPos(self.index * -self.itemWidth + self.peekWidth + self.spacingOffset);
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
						self.gotoPos(self.peekWidth + self.spacingOffset);
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

soysauce.inputClear = (function() {
	
	function inputClear(selector) {
		var options = soysauce.getOptions(selector),
		    self = this,
		    iconFocus = false;
		
		this.type = "InputClear";
		this.widget = $(selector);
		this.id = parseInt($(selector).attr("data-ss-id"));
		this.icon;
		
		this.widget.on("focus keyup", function() {
			self.handleIcon();
		});
		
		this.widget.on("blur", function() {
			if (iconFocus) return;
			self.widget.attr("data-ss-clear", "off");
		});
		
		this.widget.wrap("<div data-ss-component='input-wrapper'></div>");
		
    this.widget.parent().css({
      "display": self.widget.css("display"),
      "width": self.widget.css("width")
    });
		
		this.widget.attr("data-ss-clear", "off");
		this.widget.after("<span data-ss-component='icon'></span>");
		
		this.icon = this.widget.find("+ [data-ss-component='icon']");
		
		this.icon.on("mousedown touchstart", function() {
			iconFocus = true;
			self.icon.one("mouseup touchend", function() {
				self.clear();
				iconFocus = false;
			});
		});
	}
	
	inputClear.prototype.clear = function() {
		this.widget.val("").attr("data-ss-clear", "off");
	};
	
	inputClear.prototype.handleIcon = function() {
		this.widget.attr("data-ss-clear", (!this.widget.val().length) ? "off" : "on");
	};
	
	return {
		init: function(selector) {
			return new inputClear(selector);
		}
	};
	
})();

soysauce.lazyloader = (function() {
	var THROTTLE = 100; // milliseconds
	
	function Lazyloader(selector) {
		var options = soysauce.getOptions(selector);
		var self = this;
		
		this.type = "Lazyloader";
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
	
	return {
		init: function(selector) {
			return new Lazyloader(selector);
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
			var togglerID = $(selector).attr("data-ss-toggler-id");
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
				self.toggle(e);
			});
			
			this.setState("closed");
			this.id = parseInt(this.button.attr("data-ss-id"));
			this.content.attr("data-ss-id", this.id);
			
			if (soysauce.vars.degrade) {
				this.content.attr("data-ss-degrade", "true");
				this.button.attr("data-ss-degrade", "true");
			}
		}
		else {
			this.widget = $(selector);
			this.orphan = false;
			this.allButtons = this.widget.find("> [data-ss-component='button']");
			this.button = this.allButtons.first();
			this.allContent = this.widget.find("> [data-ss-component='content']");
			this.content = this.allContent.first();
			this.id = parseInt(this.widget.attr("data-ss-id"));
		}
		
		this.type = "Toggler";
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
		this.doAjax = false;
		this.ajaxData;
		this.ajaxing = false;
		
		// Tab
		this.tab = false;
		this.childTabOpen = false;
		this.nocollapse = false;
		
		// Responsive
		this.responsive = false;
		this.responsiveVars = {
			threshold: (!this.widget.attr("data-ss-responsive-threshold")) ? 768 : parseInt(this.widget.attr("data-ss-responsive-threshold")),
			accordions: true
		};
		
		if (options) options.forEach(function(option) {
			switch(option) {
				case "ajax":
					self.ajax = true;
					self.doAjax = true;
					break;
				case "tabs":
					self.tab = true;
					break;
				case "nocollapse":
					self.nocollapse = true;
					break;
				case "slide":
					self.slide = true;
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
			this.parentID = parseInt(parent.attr("data-ss-id"));
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
						height = content.outerHeight();
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
						content.attr("data-ss-slide-height", content.outerHeight());
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
			self.toggle(e);
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
				ajaxButton.click(function(e) {
					
					if (!self.doAjax || self.ajaxing) return;

					self.setState("ajaxing");
					self.ready = false;

					url = $(contentItem).attr("data-ss-ajax-url");

					if (soysauce.browserInfo.supportsSessionStorage && !soysauce.browserInfo.sessionStorageFull) {
						self.ajaxing = true;
						if (!sessionStorage.getItem(url)) {
							firstTime = true;
							$.ajax({
								url: url,
								type: "GET",
								success: function(data) {
									if (typeof(data) === "object") {
										self.ajaxData = data;
									}
									else {
										self.ajaxData = JSON.parse(data);
									}
									try {
										sessionStorage.setItem(url, JSON.stringify(data));
									}
									catch(e) {
										if (e.code === DOMException.QUOTA_EXCEEDED_ERR) {
											soysauce.browserInfo.sessionStorageFull = true;
											console.warn("Soysauce: SessionStorage full. Unable to store item.")
										}
									}
									obj.trigger("SSAjaxComplete");
									self.setAjaxComplete();
									firstTime = false;
								},
								error: function(data) {
									console.warn("Soysauce: Unable to fetch " + url);
									self.setAjaxComplete();
								}
							});
						}
						else {
							self.ajaxData = JSON.parse(sessionStorage.getItem(url));
							obj.trigger("SSAjaxComplete");
						}
					}
					else {
						$.ajax({
							url: url,
							type: "GET",
							success: function(data) {
								if (typeof(data) === "object") {
									self.ajaxData = data;
								}
								else {
									self.ajaxData = JSON.parse(data);
								}
								obj.trigger("SSAjaxComplete");
								self.ajaxing = false;
							},
							error: function(data) {
								console.warn("Soysauce: Unable to fetch " + url);
								self.setAjaxComplete();
							}
						});
					}
					if (!firstTime) {
						self.setAjaxComplete();
					}
				});
			});
		}
		
		if (this.tab && this.nocollapse) {
			this.content.imagesLoaded(function() {
				self.widget.css("min-height", self.button.outerHeight() + self.content.outerHeight());
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
					self.height = self.content.height();
					self.content.css("height", self.height + "px");
				});
			}
			else {
				self.height = parseInt(self.content.attr("data-ss-slide-height"));
				self.content.css("height", self.height + "px");
			}
		}
		
		if (this.tab && this.nocollapse) {
			this.widget.css("min-height", this.button.outerHeight() + this.content.outerHeight());
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
      var subs = this.allContent.find('[data-ss-widget]');
      
      this.allContent.css('clear', 'both').css('position','relative');

      if (!subs.length) {
        this.doResize();
      }
      else {
        subs.each(function(i, e) {
          var widget = soysauce.fetch(e).widget;

          if ((i + 1) !== subs.length) return;
            
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
			//readjust height on resize
			if (this.tab && this.nocollapse) {
				this.widget.css("min-height", this.button.outerHeight() + this.content.outerHeight());
			}
			return;
		}
		if (this.opened) {
			this.height = this.content.find("> [data-ss-component='wrapper']").outerHeight();
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

	Toggler.prototype.toggle = function(e) {
		var self = this;
		var target;
		
		if (this.freeze || this.ajaxing) return;

		if (!e) {
			target = this.button[0];
		}
		else {
			target = e.target;
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
				self.height = parseInt(self.content.attr("data-ss-slide-height"));
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
		this.doAjax = false;
		this.ajaxing = false;
		this.ready = true;
		if (this.opened) {
			this.setState("open");
		}
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
			this.widget.css("min-height", this.button.outerHeight() + this.content.outerHeight() + "px");
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
