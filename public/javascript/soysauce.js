/*
	FastClick (removes the click delay found on mobile devices).
	More info can be found on https://github.com/ftlabs/fastclick
*/
(function() {
	// Regex that excludes FastClick
	// Note: newer Android devices (4.0+) do not seem to have a click delay
	var excludeFastClick = /android [4]/i.test(navigator.userAgent);
	if (excludeFastClick) return;
	
	function FastClick(layer) {
		'use strict';
		var oldOnClick, self = this;
		this.trackingClick = false;
		this.trackingClickStart = 0;
		this.targetElement = null;
		this.layer = layer;

		if (!layer || !layer.nodeType) {
			throw new TypeError('Layer must be a document node');
		}

		this.onClick = function() { FastClick.prototype.onClick.apply(self, arguments); };
		this.onTouchStart = function() { FastClick.prototype.onTouchStart.apply(self, arguments); };
		this.onTouchMove = function() { FastClick.prototype.onTouchMove.apply(self, arguments); };
		this.onTouchEnd = function() { FastClick.prototype.onTouchEnd.apply(self, arguments); };
		this.onTouchCancel = function() { FastClick.prototype.onTouchCancel.apply(self, arguments); };

		if (typeof window.ontouchstart === 'undefined') {
			return;
		}

		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		if (typeof layer.onclick === 'function') {

			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	FastClick.prototype.deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;

	FastClick.prototype.needsClick = function(target) {
		'use strict';
		switch (target.nodeName.toLowerCase()) {
		case 'label':
		case 'video':
			return true;
		default:
			return (/\bneedsclick\b/).test(target.className);
		}
	};

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
			return true;
		default:
			return (/\bneedsfocus\b/).test(target.className);
		}
	};

	FastClick.prototype.maybeSendClick = function(targetElement, event) {
		'use strict';
		var clickEvent, touch;

		if (this.needsClick(targetElement)) {
			return false;
		}

		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent('click', true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);

		return true;
	};

	FastClick.prototype.onTouchStart = function(event) {
		'use strict';
		var touch = event.targetTouches[0];

		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = event.target;

		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		if (event.timeStamp - this.lastClickTime < 200) {
			event.preventDefault();
		}
		return true;
	};

	FastClick.prototype.touchHasMoved = function(event) {
		'use strict';
		var touch = event.targetTouches[0];

		if (Math.abs(touch.pageX - this.touchStartX) > 10 || Math.abs(touch.pageY - this.touchStartY) > 10) {
			return true;
		}

		return false;
	};

	FastClick.prototype.onTouchMove = function(event) {
		'use strict';
		if (!this.trackingClick) {
			return true;
		}

		if (this.targetElement !== event.target || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}

		return true;
	};

	FastClick.prototype.findControl = function(labelElement) {
		'use strict';

		if (labelElement.control !== undefined) {
			return labelElement.control;
		}

		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};

	FastClick.prototype.onTouchEnd = function(event) {
		'use strict';
		var forElement, trackingClickStart, targetElement = this.targetElement;

		if (!this.trackingClick) {
			return true;
		}

		if (event.timeStamp - this.lastClickTime < 200) {
			this.cancelNextClick = true
			return true;
		}

		this.lastClickTime = event.timeStamp

		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;

		if (targetElement.nodeName.toLowerCase() === 'label') {
			forElement = this.findControl(targetElement);
			if (forElement) {
				targetElement.focus();
				if (this.deviceIsAndroid) {
					return false;
				}

				if (this.maybeSendClick(forElement, event)) {
					event.preventDefault();
				}

				return false;
			}
		} else if (this.needsFocus(targetElement)) {

			if ((event.timeStamp - trackingClickStart) > 100) {

				this.targetElement = null;
				return true;
			}

			targetElement.focus();

			if (targetElement.tagName.toLowerCase() !== 'select') {
				event.preventDefault();
			}

			return false;
		}

		if (!this.maybeSendClick(targetElement, event)) {
			return false;
		}

		event.preventDefault();
		return false;
	};

	FastClick.prototype.onTouchCancel = function() {
		'use strict';
		this.trackingClick = false;
		this.targetElement = null;
	};

	FastClick.prototype.onClick = function(event) {
		'use strict';

		var oldTargetElement;

		if (event.forwardedTouchEvent) {
			return true;
		}

		if (!this.targetElement) {
			return true;
		}

		oldTargetElement = this.targetElement;
		this.targetElement = null;

		if (!event.cancelable) {
			return true;
		}

		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		if (!this.needsClick(oldTargetElement) || this.cancelNextClick) {
			this.cancelNextClick = false
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			}

			event.stopPropagation();
			event.preventDefault();

			return false;
		}

		return true;
	};

	FastClick.prototype.destroy = function() {
		'use strict';
		var layer = this.layer;

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};

	window.addEventListener('load', function() {
	    new FastClick(document.body);
	}, false);
})();

/*!
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
	vars: {
		idCount: 0
	},
	init: function(selector) {
		if (!selector) {
			var set = $("[data-ss-widget]");
			soysauce.vars.idCount = set.length;
			for (var i = 0; i < soysauce.vars.idCount; i++) {
				$(set[i]).attr("data-ss-id", i+1);
			}
		}
		else {
			// TODO
		}
	},
	getOptions: function(selector) {
		if($(selector).attr("data-ss-options") == undefined) return false;
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
		if (e === undefined) return false;
		e.stopImmediatePropagation();
		e.preventDefault();
	},
	fetch: function(selector) { // Fetch by ID
		if (selector === undefined) return false;
		if (typeof(selector) === "object") selector = $(selector).attr("data-ss-id");
		if (/(^#?\.?\w+$)/.test(selector)) {
			var query, ret, type;
			
			if (selector===+selector && selector === (selector|0)) {
				query = "[data-ss-id='" + selector + "']";
			}
			else {
				query = selector;
			}
			
			type = $(query).attr("data-ss-widget");
			
			selector = parseInt(selector);
			switch(type) {
				case "toggler":
					soysauce.togglers.forEach(function(widget) {
						if (widget.id == selector) {
							ret = widget;
						}
					});
					return ret;
				case "carousel":
					soysauce.carousels.forEach(function(widget) {
						if (widget.id == selector) {
							ret = widget;
						}
					});
					return ret;
				case "cc_validator":
					soysauce.ccValidators.forEach(function(widget) {
						if (widget.id == selector) {
							ret = widget;
						}
					});
					return ret;
				default:
					console.warn("Soysauce: Unfetchable item.");
			}
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
		supportsSessionStorage: (typeof(window.sessionStorage) !== "undefined") ? true : false
	},
	freezeChildren: function(selector) {
		var children = $("[data-ss-id='" + selector + "']").find("[data-ss-widget]");
		children.each(function(index, child) {
			var id = $(child).attr("data-ss-id");
			soysauce.freeze(id, false);
		});
	},
	freeze: function(selector, freezeChildren) {
		if (typeof(selector) === "object") {
			selector = parseInt($(selector).attr("data-ss-id"));
		}
		freezeChildren = (freezeChildren === undefined) ? true : false;
		soysauce.fetch(selector).handleFreeze();
		if (freezeChildren) {
			soysauce.freezeChildren(selector);
		}
	},
	unfreeze: function(selector) {
		if (typeof(selector) === "object") {
			selector = parseInt($(selector).attr("data-ss-id"));
		}
		var children = $("[data-ss-id='" + selector + "']").find("[data-ss-widget]");
		soysauce.fetch(selector).handleUnfreeze();
		children.each(function(index, child) {
			var id = $(child).attr("data-ss-id");
			soysauce.fetch(id).handleUnfreeze();
		});
	},
	reload: function(selector) {
		// TODO
	},
	scrollTop: function() {
		$(document).ready(function() {
			window.setTimeout(function(){
				window.scrollTo(0, 1);
			}, 0);
		});
	},
	imagesLoaded: function(selector) {
		// TODO
	}
}

soysauce.init();
soysauce.scrollTop();
soysauce.imagesLoaded();

}

soysauce.lateload = function(selector) {
	
	function loadItem(selector) {
		var curr = $(selector);
		var val = curr.attr("data-ss-ll-src");
		if (val) 
			curr.attr("src", val).attr("data-ss-ll-src", "");
	}
	
	if (selector)
		$("[data-ss-ll-src]:not([data-ss-options])").each(loadItem(selector));
	else {
		$(document).on("DOMContentLoaded", function() {
			$("[data-ss-ll-src][data-ss-options='dom']").each(function(i, e) {
				loadItem(e);
			});
		});
		$(window).on("load", function() {
			$("[data-ss-ll-src][data-ss-options='load']").each(function(i, e) {
				loadItem(e);
			});
		});
	}
};

soysauce.lateload();

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
			if (self.jumping) return;
			
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
				carousels.splice(i, 1);
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
		var thumbnails = carousel.container.find("[data-ss-component='thumbnail']");
		
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
		
		carousel.dots.html(dotsHtml);
		carousel.dots = carousel.dots.find("div");
		carousel.dots.attr("data-ss-state", "inactive")
		carousel.dots.first().attr("data-ss-state", "active");
		carousel.dots.on("click", function(e) {
			var currXPos = parseInt(soysauce.getArrayFromMatrix(carousel.container.css("-webkit-transform"))[4]);
			if (currXPos === carousel.offset) {
				carousel.ready = true;
			}
			
			if (!carousel.ready || carousel.interrupted || carousel.freeze) return;
			
			soysauce.stifle(e);
			
			var index = carousel.dots.index(this);
			
			if (carousel.infinite) {
				index += 1;
			}
			
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
			
			if ((targetComponent === "zoom_icon" || targetComponent === "dot" || targetComponent === "thumbnail") && carousel.interrupted) {
				var currXPos = parseInt(soysauce.getArrayFromMatrix(carousel.container.css("-webkit-transform"))[4]);
				if (currXPos === carousel.offset) {
					carousel.interrupted = false;
				}
			}
			
			if (carousel.jumping || carousel.freeze || targetComponent === "button" || targetComponent === "zoom_icon" || targetComponent === "dot" || targetComponent === "dots" || targetComponent === "thumbnail")
				return;
			
			carousel.handleSwipe(e);
		});
		
		carousel.ready = true;
		carousel.container.on(TRANSITION_END, function() {
			carousel.ready = true;
			carousel.jumping = false;
			carousel.interrupted = false;
			
			carousel.container.attr("data-ss-state", "ready");
			
			if (carousel.autoscroll && carousel.autoscrollRestartID === undefined) {
				carousel.autoscrollRestartID = window.setTimeout(function() {
					carousel.autoscrollOn();
				}, 1000);
			}
			
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

soysauce.ccValidators = (function() {
	var validators = new Array();
	
	function ccValidator(input) {
		var self = this;
		
		this.id = parseInt($(input).attr("data-ss-id"));
		this.input = $(input);
		this.state1;
		this.state2;
		
		this.input.on("keyup change", function(e) {
			var card_num = e.target.value.replace(/-/g, "");
			
			// State 1
			if (card_num.length === 1) {
				$(e.target).trigger("state1");
				if (card_num.match(/^4/)) {
					self.state1 = "visa";
				} else if (card_num.match(/^5/)) {
					self.state1 = "mastercard";
				} else if (card_num.match(/^3/)) {
					self.state1 = "amex dinersclub";
				} else if (card_num.match(/^6(?:011|5[0-9]{2})/)) {
					self.state1 = "discover";
				} else if (card_num.match(/^(?:2131|1800|35\d{3})/)) {
					self.state1 = "jcb";
				} else {
					self.state1 = undefined;
				}
			} else if (card_num.length === 0) {
				self.state1 = undefined;
			}

			// State 2
			if (card_num.match(/^4[0-9]{12}(?:[0-9]{3})?$/)) {
				self.state2 = "visa";
				$(e.target).trigger("state2");
			} else if (card_num.match(/^5[1-5][0-9]{14}$/)) {
				self.state2 = "mastercard";
				$(e.target).trigger("state2");
			} else if (card_num.match(/^3[47][0-9]{13}$/)) {
				self.state2 = "amex";
				$(e.target).trigger("state2");
			} else if (card_num.match(/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/)) {
				self.state2 = "dinersclub";
				$(e.target).trigger("state2");
			} else if (card_num.match(/^6(?:011|5[0-9]{2})[0-9]{12}$/)) {
				self.state2 = "discover";
				$(e.target).trigger("state2");
			} else if (card_num.match(/^(?:2131|1800|35\d{3})\d{11}$/)) {
				self.state2 = "jcb";
				$(e.target).trigger("state2");
			} else {
				self.state2 = undefined;
			}
				
		});
	}
	
	// Init
	(function() {
		$("[data-ss-widget='cc_validator']").each(function() {
			var validator = new ccValidator(this);
			validators.push(validator);
		});
		
	})(); // end init
	
	
	return validators;
})();

soysauce.overlay = function(cmd) {
	switch(cmd) {
		case "init":
			if ($("[data-ss-widget='overlay']") === undefined) break;
			var div = document.createElement("div");
			div.setAttribute("data-ss-widget", "overlay");
			div.setAttribute("data-ss-state", "inactive");
			document.body.appendChild(div);
			break;
		case "on":
			$("[data-ss-widget='overlay']").show();
			window.setTimeout(function() {
				$("[data-ss-widget='overlay']").attr("data-ss-state","active");
			}, 0);
			break;
		case "off":
			$("[data-ss-widget='overlay']").attr("data-ss-state","inactive");
			window.setTimeout(function() {
				$("[data-ss-widget='overlay']").hide();
			}, 400);
			break;
		case undefined:
			console.warn("Soysauce: Please provide a command.");
			break;
		default:
			console.warn("Soysauce: Unrecognized command.");
			break;
	}
};

soysauce.overlay("init");

soysauce.togglers = (function() {
	var togglers = new Array();
	var TRANSITION_END = "transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd";
	var currentViewportWidth = window.innerWidth;

	// Togglers
	function Toggler(obj) {
		// Base
		this.widget = $(obj);
		this.id = this.widget.attr("data-ss-id");
		this.parentID = 0;
		this.tabID;
		this.state = "closed";
		this.button = this.widget.find("> [data-ss-component='button']");
		this.content = this.widget.find("> [data-ss-component='content']");
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
		
		// Ajax
		this.ajax = true;
		this.doAjax = false;
		
		// Tab
		this.tab = false;
		this.childTabOpen = false;
		
		// Responsive
		this.responsive = false;
		this.responsiveVars = {
			threshold: 0,
			accordions: true
		};
	}

	Toggler.prototype.open = function() {
		var slideOpenWithTab = this.tab && this.responsiveVars.accordions;
		
		if (!this.ready && !slideOpenWithTab) return;
		
		var self = this;
		var prevHeight = 0;
		
		if (this.slide) {
			
			if (!slideOpenWithTab) return;
			
			this.ready = false;
			
			if (this.adjustFlag || slideOpenWithTab) this.content.one(TRANSITION_END, function() {
				self.adjustHeight();
			});
			
			if (this.isChildToggler && this.parent.slide) {
				if (this.tab) {
					if (!this.parent.childTabOpen) {
						this.parent.addHeight(this.height);
						this.parent.childTabOpen = true;
					}
					else {
						var offset = this.height - prevHeight;
						this.parent.addHeight(offset);
					}
				}
				else {
					this.parent.addHeight(this.height);
				}
			}
			
			if (this.ajax && this.height === 0) {
				$(this.content).imagesLoaded(function() {
					self.content.css("height", "auto");
					self.height = self.content.height();
					self.content.css("height", self.height + "px");
				});
			}
			
			else {
				this.content.css("height", this.height + "px");
			}
		}
		
		this.setState("open");
	};

	Toggler.prototype.close = function() {
		var self = this;
		
		if (!this.ready) return;
		
		if (this.slide) {
			this.ready = false;
			if (this.isChildToggler && this.parent.slide && !this.tab) {
				this.parent.addHeight(-this.height);
			}
			this.content.css("height", "0px");
		}
		
		this.setState("closed");
	};

	// TODO: this needs improvement; get new height and set it so that it animates on close after a resize/orientation change
	Toggler.prototype.adjustHeight = function() {
		// this.content.css("height", "auto");
		// this.height = this.content.height();
		this.adjustFlag = false;
	};

	Toggler.prototype.addHeight = function(height) {
		if (!height===+height || !height===(height|0)) return;
		this.height += height;
		this.height = (this.height < 0) ? 0 : this.height;
		this.content.css("height", this.height + "px");
	};

	Toggler.prototype.setHeight = function(height) {
		if (!height===+height || !height===(height|0)) return;
		this.height = height;
		this.height = (this.height < 0) ? 0 : this.height;
		this.content.css("height", height + "px");
	};

	Toggler.prototype.toggle = function() {
		if (this.freeze) return;
		(!this.opened) ? this.open() : this.close();
	};

	Toggler.prototype.toggleTabs = function(e) {
		if (this.freeze) return;
		
		var collapse = (this.responsiveVars.accordions && 
										this.button.attr("data-ss-state") === "open" &&
										this.button[0] === e.target) ? true : false;
		
		this.close();
		
		this.button = $(e.target);
		this.content = $(e.target).find("+ [data-ss-component='content']");
		
		if (collapse) {
			this.widget.attr("data-ss-state", "closed");
			this.opened = false;
			return;
		}
		
		this.open();
	};

	Toggler.prototype.handleAjax = function() {
		var obj = this.widget;
		var content = this.content;
		var url = "";
		var callback;
		var self = this;
		var firstTime = false;

		this.button.click(function(e) {
			if (!self.doAjax) {
				self.toggle();
				soysauce.stifle(e);
				return;
			}

			soysauce.stifle(e);
			self.setState("ajaxing");
			self.ready = false;

			if(!obj.attr("data-ss-ajax-url")) {
				console.warn("Soysauce: 'data-ss-ajax-url' tag required. Must be on the same domain.");
				return;
			}

			if(!obj.attr("data-ss-ajax-callback")) {
				console.warn("Soysauce: 'data-ss-ajax-callback' required.");
				return;
			}
			
			url = obj.attr("data-ss-ajax-url");
			callback = obj.attr("data-ss-ajax-callback");
			
			if (soysauce.browserInfo.supportsSessionStorage) {
				if (sessionStorage.getItem(url) === null) {
					firstTime = true;
					$.get(url, function(data) {
						sessionStorage.setItem(url, JSON.stringify(data));
						eval(callback + "(" + JSON.stringify(data) + ")");
						self.setAjaxComplete();
						firstTime = false;
					});
				}
				else
					eval(callback + "(" + sessionStorage.getItem(url) + ")");
			}
			else
				$.get(url, eval(callback));
			
			if (!firstTime)
				self.setAjaxComplete();
		});
	};

	Toggler.prototype.setState = function(state) {
		this.state = state;
		this.button.attr("data-ss-state", state);
		this.content.attr("data-ss-state", state);
		
		if (!this.tab) {
			this.widget.attr("data-ss-state", state);
		}
		
		if (state === "open") {
			this.opened = true;
			this.widget.attr("data-ss-state", state);
		}
		else if (!this.tab) {
			this.opened = false;
		}
		
		if (this.responsive && this.opened) {
			this.handleResponsive();
		}
	};

	Toggler.prototype.setAjaxComplete = function() {
		this.doAjax = false;
		this.ready = true;
		if (this.state === "open") {
			this.open();
			this.opened = true;
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
			if (!this.opened) {
				this.button = this.widget.find("[data-ss-component='button']").first();
				this.content = this.widget.find("[data-ss-component='content']").first();
				this.open();
			}
			this.widget.css("min-height", this.button.outerHeight() + this.content.outerHeight() + "px");
		}
		else {
			this.responsiveVars.accordions = true;
			this.widget.css("min-height", "0");
		}
	};
	
	// Initialize
	(function() {
		$("[data-ss-widget='toggler']").each(function() {
			var item = new Toggler(this);
			var self = this;
			var options = soysauce.getOptions(this);

			item.button.append("<span class='icon'></span>");
			item.content.wrapInner("<div data-ss-component='wrapper'/>");

			item.hasTogglers = (item.widget.has("[data-ss-widget='toggler']").length > 0) ? true : false; 
			item.isChildToggler = (item.widget.parents("[data-ss-widget='toggler']").length > 0) ? true : false;
			
			if (item.isChildToggler) {
				var parent = item.widget.parents("[data-ss-widget='toggler']");
				item.parentID = parseInt(parent.attr("data-ss-id"));
				item.parent = parent;
			}

			if (options) options.forEach(function(option) {
				switch(option) {
					case "ajax":
						item.ajax = true;
						item.doAjax = true;
						item.handleAjax();
						break;
					case "tabs":
						item.tab = true;
						break;
					case "slide":
						item.slide = true;
						break;
					case "responsive":
						item.responsive = true;
						break;
				}
			});
			
			if (item.widget.attr("data-ss-state") !== undefined && item.widget.attr("data-ss-state") === "open") {
				item.setState("open");
			}
			else {
				item.setState("closed");
			}
			
			if (item.slide) {
				item.setState("open");
				
				if (item.hasTogglers) {
					var height = 0;
					item.content.find("[data-ss-component='button']").each(function() {
						height += item.widget.height();
					});
					item.height = height;
				}
				else {
					item.content.each(function() {
						$(this).attr("data-ss-slide-height", $(this).height());
					});
					item.height = item.content.height();
				}
				
				item.content.css("height", "0px");
				item.setState("closed");
				item.content.on(TRANSITION_END, function() {
					item.ready = true;
				});
				
				$(window).on("resize orientationchange", function(e) {
					if (e.type === "orientationchange") {
						item.adjustFlag = true;
						if (item.state === "open") {
							item.adjustHeight();
						}
					}
					else {
						if (window.innerWidth !== currentViewportWidth) {
							currentViewportWidth = window.innerWidth;
							item.adjustFlag = true;
							if (item.state === "open") {
								item.adjustHeight();
							}
						}
					}
				});
			}
			
			if (item.tab) item.button.click(function(e) {
				item.toggleTabs(e);
			});
			else item.button.click(function() {
				item.toggle();
			});

			// 	Responsive is a custom option which takes multiple buttons and content.
			// 	This inherits the "slide" and "tab" options.
			if (item.responsive) {
				item.responsiveVars.threshold = parseInt($(this).attr("data-ss-responsive-threshold"));
				if (!item.responsiveVars.threshold) {
					console.warn("Soysauce: [data-ss-responsive-threshold] tag required.");
				}
				$(window).on("resize orientationchange", function(e) {
					if (e.type === "orientationchange") {
						item.handleResponsive();
					}
					else {
						if (window.innerWidth !== currentViewportWidth) {
							currentViewportWidth = window.innerWidth;
							item.handleResponsive();
						}
					}
				});
				item.handleResponsive();
			}

			togglers.push(item);
		});
	})(); // end init

	return togglers;
})();
