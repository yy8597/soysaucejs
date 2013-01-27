// Regex that excludes FastClick
// Note: newer Android devices (4.0+) do not seem to have a click delay
var excludeFastClick = !(/android [4]/i.test(navigator.userAgent)); 

if (excludeFastClick) {
(function() {
	/*
		FastClick (removes the click delay found on mobile devices).
		More info can be found on https://github.com/ftlabs/fastclick
	*/
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


	if (typeof define === 'function' && define.amd) {
		define(function() {
			'use strict';
			return FastClick;
		});
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = function(layer) {
			'use strict';
			return new FastClick(layer);
		};

		module.exports.FastClick = FastClick;
	}

	window.addEventListener('load', function() {
	    new FastClick(document.body);
	}, false);
})();
}
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

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

if(typeof(soysauce) == "undefined") {
"use strict";	
soysauce = {
	init: function() {
		var set = $("[data-ss-widget]");
		for (var i = 0; i < set.length; i++) {
				$(set[i]).attr("data-ss-id", i+1);
		}
		$(document).ready(function() {
			window.setTimeout(function(){
				window.scrollTo(0, 1);
			}, 0);
		});
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
		if (selector===+selector && selector===(selector|0) || selector.match(/^\d+$/).length > 0) {
			var query = "[data-ss-id='" + selector + "']";
			var type = $(query).attr("data-ss-widget");
			var ret;
			selector = parseInt(selector);
			switch(type) {
				case "accordion":
					soysauce.accordions.forEach(function(e) {
						if (e.id == selector) ret = e;
					});
					return ret;
				case "carousel":
					soysauce.carousels.forEach(function(e) {
						if (e.id == selector) ret = e;
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
	accordions: {},
	buttons: {},
	lateload: {},
	overlay: {},
	ccValidation: {},
	carousels: {}
}

soysauce.init();

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

soysauce.accordions = (function() {
	var accordions = new Array();
	var accordionTabGroups = new Array();

	function AccordionTabGroup(id) {
		this.accordions = new Array();
		this.groupid = id;
		this.currOpen;
	}
	
	AccordionTabGroup.prototype.setCurrOpen = function(selector) {
		this.currOpen = selector;
	};
	
	AccordionTabGroup.prototype.addAccordion = function(selector) {
		if (selector === undefined || !typeof(Accordion)) return false;
		this.accordions.push(selector);
	};
	
	AccordionTabGroup.prototype.getCurrOpen = function() {
		return this.currOpen;
	};
	
	AccordionTabGroup.prototype.getAccordions = function() {
		return this.accordions;
	};
	
	AccordionTabGroup.prototype.getID = function() {
		return this.groupid;
	};

	function Accordion(obj) {
		this.id = $(obj).attr("data-ss-id");
		this.parentID = 0;
		this.tabID = 0;
		this.state = "closed";
		this.obj = $(obj);
		this.button = $(obj).find("> [data-ss-component='button']");
		this.content = $(obj).find("> [data-ss-component='content']");
		this.overlay = false;
		this.tab = false;
		this.slide = false;
		this.ajax = true;
		this.doAjax = false;
		this.height = 0;
		this.isChildAccordion = false;
		this.hasAccordions = false;
		this.childTabOpen = false;
		this.tabGroup = undefined;
		this.parent = undefined;
		this.ready = true;
		this.adjustFlag = false;
	}

	Accordion.prototype.open = function() {
		if (!this.ready) return;
		
		if (this.adjustFlag)
			this.adjustHeight();
		
		var self = this;
		var prevHeight = 0;
		if (this.tab) {
			if(this.tabGroup.getCurrOpen() !== undefined) {
				prevHeight = this.tabGroup.getCurrOpen().height;
				this.tabGroup.getCurrOpen().close();
			}
			this.tabGroup.setCurrOpen(self);
		}
		if (this.overlay) 
			soysauce.overlay("on");
		if (this.slide) {
			this.ready = false;
			if (this.parent === undefined) 
				this.parent = soysauce.fetch(this.parentID);
			if (this.isChildAccordion && this.parent.slide) {
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
				else this.parent.addHeight(this.height);
			}
			if (this.ajax && this.height === 0) {
				$(this.content).imagesLoaded(function() {
					self.content.css("height", "auto");
					self.height = self.content.height();
					self.content.css("height", self.height + "px");
				});
			}
			else
				this.content.css("height", this.height + "px");
			this.content.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
				self.ready = true;
			});
		}
		this.setState("open");
	};

	Accordion.prototype.close = function(closeOverlay) {
		if (!this.ready) return;
		
		var self = this;
		if (this.overlay && (closeOverlay === undefined) ? true : closeOverlay) 
			soysauce.overlay("off");
		if (this.slide) {
			this.ready = false;
			if (this.parent === undefined) this.parent = soysauce.fetch(this.parentID);
			if (this.isChildAccordion && this.parent.slide) {
				if (!this.tab) this.parent.addHeight(-this.height);
			}
			this.content.css("height", "0px");
		}
		if (this.tab) {
			var currTabOpen;
			currTabOpen = this.tabGroup.getCurrOpen();
			if (currTabOpen !== undefined && currTabOpen.id == self.id) this.tabGroup.setCurrOpen(undefined);	
		}
		if (this.slide) this.content.one("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
			self.setState("closed");
			self.ready = true;
		});
		else
			this.setState("closed");
	};

	Accordion.prototype.adjustHeight = function() {
		this.content.css("height", "auto");
		this.height = this.content.height();
		this.adjustFlag = false;
	};

	Accordion.prototype.addHeight = function(height) {
		if (!height===+height || !height===(height|0)) return;
		this.height += height;
		this.height = (this.height < 0) ? 0 : this.height;
		this.content.css("height", this.height + "px");
	};

	Accordion.prototype.setHeight = function(height) {
		if (!height===+height || !height===(height|0)) return;
		this.height = height;
		this.height = (this.height < 0) ? 0 : this.height;
		this.content.css("height", height + "px");
	};

	Accordion.prototype.toggle = function() {
		(this.state != "open") ? this.open() : this.close();
	};

	Accordion.prototype.handleAjax = function() {
		var obj = this.obj;
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

	Accordion.prototype.setState = function(state) {
		this.state = state;
		this.obj.attr("data-ss-state", state);
		this.button.attr("data-ss-state", state);
		this.content.attr("data-ss-state", state);
	};

	Accordion.prototype.setAjaxComplete = function() {
		this.doAjax = false;
		this.ready = true;
		if (this.state === "ajaxing")
			this.open();
	};

	// Initialize
	(function() {
		var tabID = 1;
		var group;
		$("[data-ss-widget='accordion']").each(function() {
			var item = new Accordion(this);
			var self = this;
			var options = soysauce.getOptions(this);

			$(this).find("> [data-ss-component='button']").append("<span class='icon'></span>");

			item.hasAccordions = ($(this).has("[data-ss-widget='accordion']").length > 0) ? true : false; 
			item.isChildAccordion = ($(this).parents("[data-ss-widget='accordion']").length > 0) ? true : false;
			item.parentID = $(this).parents("[data-ss-widget='accordion']").attr("data-ss-id");

			if(options) options.forEach(function(option) {
				switch(option) {
					case "ajax":
						item.ajax = true;
						item.doAjax = true;
						item.handleAjax();
						break;
					case "overlay":
						item.overlay = true;
						break;
					case "tab":
						item.tab = true;
						break;
					case "slide":
						item.slide = true;
						break;
				}
			});
			
			if (item.tab) {
				if (!$(self).attr("data-ss-tab-id")) {
					var siblings = $(self).find("~ [data-ss-options*='tab']");
					var group_name = "group"
					group = new AccordionTabGroup(tabID);
					item.tabID = tabID;
					$(self).attr("data-ss-tab-id", tabID);
					siblings.attr("data-ss-tab-id", tabID);
					item.tabGroup = group;
					group.addAccordion(item);
					accordionTabGroups.push(group);
					tabID++;
				} else {
					item.tabID = $(self).attr("data-ss-tab-id");
					accordionTabGroups.forEach(function(e) {
						if (e.groupid == item.tabID) {
							item.tabGroup = e;
							e.addAccordion(item);
						}
					});
				}
			}
			
			if (item.slide) {
				if (item.hasAccordions) {
					var height = 0;
					item.content.find("[data-ss-component='button']").each(function() {
						height += $(this).height();
					});
					item.height = height;
				}
				else
					item.height = item.content.height();
				
				item.content.css("height", "0px");
			}
			
			$(this).find("> [data-ss-component='button']").click(function() {
				item.toggle();
			});

			$(window).on("resize orientationchange", function() {
				item.adjustFlag = true;
				if (item.state === "open")
					item.adjustHeight();
			});

			accordions.push(item);
		});
	})(); // end init

	return accordions;
})();

soysauce.accordions.forEach(function(e) {
	if (e.state == "closed") e.setState("closed");
	if (e.state == "closed" && e.slide) e.content.css("height", "0px");
});

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
		this.isZooming = false;
		this.isZoomed = false;
		this.panMax = {x:0, y:0};
		this.panCoords = {x:0, y:0};
		this.panCoordsStart = {x:0, y:0};
		this.panning = false;
		this.lockScroll = undefined;
		this.zoomIcon;
		this.nextBtn;
		this.prevBtn;
		this.infiniteID;
		this.forward;
		this.lastSlideTime;
	}
	
	Carousel.prototype.gotoPos = function(x, fast) {
		var self = this;
		
		this.offset = x;
		this.setStyle(x);
		
		if (this.ready)
			this.container.attr("data-ss-state", "ready");
		else
			this.container.attr("data-ss-state", (fast) ? "intransit-fast" : "intransit");
	
		if (this.infinite) {
			var duration = parseFloat(this.container.css("-webkit-transition-duration").replace(/s$/,"")) * 1000;
			
			if (duration === (undefined || null)) duration = 850;
			
			// Slide Backward
			if (this.index === this.numChildren - 2 && !this.forward) {
				this.infiniteID = window.setTimeout(function() {
					self.container.attr("data-ss-state", "notransition");
					self.offset = -self.index*self.itemWidth + self.peekWidth/2;
					self.setStyle(self.offset);
					window.setTimeout(function() {
						self.container.attr("data-ss-state", "ready");
						self.ready = true;
					}, 0);
				}, duration);
			}
			// Slide Forward
			else if (this.index === 1 && this.forward) {
				this.infiniteID = window.setTimeout(function() {
					self.container.attr("data-ss-state", "notransition");
					self.offset = -self.itemWidth + self.peekWidth/2;
					self.setStyle(self.offset);
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
			self.setStyle(self.offset);
		}
		// Backward Loop Interrupt
		else if (this.infinite && (this.index === this.numChildren - 2) && !this.forward) {
			window.clearInterval(self.infiniteID);
			self.offset = xcoord - self.itemWidth*(self.numChildren - 2);
			self.setStyle(self.offset);
		}
		else
			this.setStyle(xcoord);
		
		coords1 = soysauce.getCoords(e);
		
		this.container.closest("[data-ss-widget='carousel']").on("touchmove mousemove", function(e2) {
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
				self.setStyle(self.offset - dragOffset);
			else
				self.setStyle(xcoord - dragOffset);
		});
		
		if (this.infiniteID !== undefined) this.container.closest("[data-ss-widget='carousel']").one("touchend mouseup", function(e2) {
			self.infiniteID = undefined;
			self.container.attr("data-ss-state", "intransit");
			
			if (self.index === self.numChildren - 2)
				self.offset = -self.index*self.itemWidth + self.peekWidth/2;
			else if (self.index === 1)
				self.offset = -self.itemWidth + self.peekWidth/2;
			
			window.setTimeout(function() {
				self.setStyle(self.offset);
			}, 0);
		});
		
		return ret;
	};
	
	Carousel.prototype.handleSwipe = function(e1) {
		var self = this;
		var coords1, coords2, lastX;
		
		var coords1x;
		
		if (this.infinite) {
			if (new Date().getTime() - this.lastSlideTime < 225) return;
			this.lastSlideTime = new Date().getTime();
		}
		
		coords1 = soysauce.getCoords(e1);
		
		this.coords1x = coords1.x;
		this.coords1y = coords1.y;
		
		if (e1.type.match(/mousedown/) !== null) soysauce.stifle(e1); // for desktop debugging

		this.lockScroll = undefined;

		if (!this.ready) 
			lastX = this.handleInterrupt(e1);
		else {
			// Panning
			if (this.zoom && this.isZoomed) {
				this.container.closest("[data-ss-widget='carousel']").one("touchend mouseup", function(e2) {
					var panX = parseInt(soysauce.getArrayFromMatrix($(e2.target).css("-webkit-transform"))[4]);
					var panY = parseInt(soysauce.getArrayFromMatrix($(e2.target).css("-webkit-transform"))[5]);
					self.panCoordsStart.x = (Math.abs(panX) > 0) ? panX : 0;
					self.panCoordsStart.y = (Math.abs(panY) > 0) ? panY : 0;
				});
				this.container.closest("[data-ss-widget='carousel']").on("touchmove mousemove", function(e2) {
					soysauce.stifle(e2);
					
					if ($(e2.target).attr("data-ss-button-type") !== undefined) return;
					
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
			// Swipe Forward/Backward
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
				
				soysauce.stifle(e2);
				self.panning = true;
				lastX = coords2.x;
				dragOffset = coords1.x - coords2.x;
				self.container.attr("data-ss-state", "notransition");
				self.setStyle(self.offset - dragOffset);
			});
		}

		// Decides whether to zoom or move to next/prev item
		this.container.closest("[data-ss-widget='carousel']").one("touchend mouseup", function(e2) {
			soysauce.stifle(e2);
			
			if ($(e2.target).attr("data-ss-button-type") !== undefined) return;
			
			coords2 = soysauce.getCoords(e2);
			if (coords2 !== null) lastX = coords2.x;

			var xDist = self.coords1x - lastX;
			var yDist = self.coords1y - coords2.y;
			
			var time = Math.abs(e2.timeStamp - e1.timeStamp);
			
			var velocity = xDist / time;
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
			
			if (!isNaN(self.panCoords.x) && !isNaN(self.panCoords.y)) {
				this.isZooming = true;
				this.ready = false;
				this.container.closest("[data-ss-widget='carousel']").attr("data-ss-state", "zoomed");
				this.zoomIcon.attr("data-ss-state", "in");
				zoomImg.style.webkitTransform = zoomImg.style.msTransform = zoomImg.style.OTransform = zoomImg.style.MozTransform = zoomImg.style.transform 
				= "translate" + ((self.supports3d) ? "3d(" + self.panCoords.x + "px," + self.panCoords.y + "px,0)" : "(" + self.panCoords.x + "px," + self.panCoords.y + "px)") + " scale" + ((self.supports3d) ? "3d(" + self.zoomMultiplier + "," + self.zoomMultiplier + ",1)" : "(" + self.zoomMultiplier + "," + self.zoomMultiplier + ")"); 
				$(zoomImg).on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
					self.isZoomed = true;
					self.isZooming = false;
				});
			}
		}
		// Zoom Out
		else if (xDist < 3 && yDist < 3) {
			this.isZooming = true;
			this.ready = false;
			this.container.closest("[data-ss-widget='carousel']").attr("data-ss-state", "ready");
			this.zoomIcon.attr("data-ss-state", "out");
			zoomImg.style.webkitTransform = zoomImg.style.msTransform = zoomImg.style.OTransform = zoomImg.style.MozTransform = zoomImg.style.transform 
			= "translate" + ((self.supports3d) ? "3d(0,0,0)" : "(0,0)") + " scale" + ((self.supports3d) ? "3d(1,1,1)" : "(1,1)") ;
			$(zoomImg).on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
				self.isZoomed = false;
				self.isZooming = false;
			});
		}
		
		$(zoomImg).on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function() {
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
			carousel.lastSlideTime = new Date().getTime();
		}
		
		carousel.items = items = $(this).find("[data-ss-component='item']");;
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
							
						carousel.panMax.x = (carousel.itemWidth - carousel.peekWidth) / carousel.zoomMultiplier;				
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
					}, 0);
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

soysauce.ccValidation = (function() {
	$("body").on("keyup", "[ss-widget='ccValidation']", function(e) {
		var card_num = e.target.value.replace(/-/g, "");

		if(card_num.match(/^4[0-9]{12}(?:[0-9]{3})?$/))
			$(e.target).attr("ss-state", "visa");
		else if(card_num.match(/^5[1-5][0-9]{14}$/))
			$(e.target).attr("ss-state", "mastercard")
		else if(card_num.match(/^3[47][0-9]{13}$/))
			$(e.target).attr("ss-state", "amex")
		else if(card_num.match(/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/))
			$(e.target).attr("ss-state", "dinersclub")
		else if(card_num.match(/^6(?:011|5[0-9]{2})[0-9]{12}$/))
			$(e.target).attr("ss-state", "discover")
		else if(card_num.match(/^(?:2131|1800|35\d{3})\d{11}$/))
			$(e.target).attr("ss-state", "jcb")
		else
			$(e.target).attr("ss-state", "undefined");
	});
})();

soysauce.overlay = function(cmd) {
	switch(cmd) {
		case "init":
			if ($("[data-ss-widget='overlay']") === undefined) break;
			var div = document.createElement("div");
			div.setAttribute("data-ss-widget", "overlay");
			div.setAttribute("data-ss-state", "inactive");
			document.body.appendChild(div);
			$("[data-ss-widget='overlay']").on("click", function() {
				soysauce.overlay("off");
			});
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
