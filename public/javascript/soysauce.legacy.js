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
		case 'a':
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

if (!jQuery.fn.find) {
	jQuery.fn.extend({
		find: function( selector ) {
			var i, ret, self,
			len = this.length;

			if ( typeof selector !== "string" ) {
				self = this;
				return this.pushStack( jQuery( selector ).filter(function() {
					for ( i = 0; i < len; i++ ) {
						if ( jQuery.contains( self[ i ], this ) ) {
							return true;
						}
					}
				}));
			}

			ret = [];
			for ( i = 0; i < len; i++ ) {
				jQuery.find( selector, this[ i ], ret );
			}
        
			// Needed because $( selector, context ) becomes $( context ).find( selector )
			ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
			ret.selector = ( this.selector ? this.selector + " " : "" ) + selector;
			return ret;
		}
	});
}

if (!jQuery.fn.on) {
	jQuery.fn.extend({
		on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
			var type, origFn;

			// Types can be a map of types/handlers
			if ( typeof types === "object" ) {
				// ( types-Object, selector, data )
				if ( typeof selector !== "string" ) {
					// ( types-Object, data )
					data = data || selector;
					selector = undefined;
				}
				for ( type in types ) {
					this.on( type, selector, data, types[ type ], one );
				}
				return this;
			}

			if ( data == null && fn == null ) {
				// ( types, fn )
				fn = selector;
				data = selector = undefined;
			} else if ( fn == null ) {
				if ( typeof selector === "string" ) {
					// ( types, selector, fn )
					fn = data;
					data = undefined;
				} else {
					// ( types, data, fn )
					fn = data;
					data = selector;
					selector = undefined;
				}
			}
			if ( fn === false ) {
				fn = returnFalse;
			} else if ( !fn ) {
				return this;
			}

			if ( one === 1 ) {
				origFn = fn;
				fn = function( event ) {
					// Can use an empty set, since event contains the info
					jQuery().off( event );
					return origFn.apply( this, arguments );
				};
				// Use same guid so caller can remove using origFn
				fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
			}
			return this.each( function() {
				jQuery.event.add( this, types, fn, data, selector );
			});
		}
	});
}

if (!jQuery.fn.one) {
	jQuery.fn.extend({
		one: function( types, selector, data, fn ) {
			return this.on( types, selector, data, fn, 1 );
		}
	});
}

if (!jQuery.fn.off) {
	jQuery.fn.extend({
		off: function( types, selector, fn ) {
			var handleObj, type;
			if ( types && types.preventDefault && types.handleObj ) {
				// ( event )  dispatched jQuery.Event
				handleObj = types.handleObj;
				jQuery( types.delegateTarget ).off(
					handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
					handleObj.selector,
					handleObj.handler
				);
				return this;
			}
			if ( typeof types === "object" ) {
				// ( types-object [, selector] )
				for ( type in types ) {
					this.off( type, selector, types[ type ] );
				}
				return this;
			}
			if ( selector === false || typeof selector === "function" ) {
				// ( types [, fn] )
				fn = selector;
				selector = undefined;
			}
			if ( fn === false ) {
				fn = returnFalse;
			}
			return this.each(function() {
				jQuery.event.remove( this, types, fn, selector );
			});
		}
	});
}
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
		SUPPORTS3D: (/Android [12]|Opera/.test(navigator.userAgent)) ? false : true
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
		supportsSessionStorage: (typeof(window.sessionStorage) !== "undefined") ? true : false
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
		soysauce.vars.currentViewportWidth = window.innerWidth;
		soysauce.widgets.forEach(function(widget) {
			widget.handleResize();
		});
	}
});

// Widget Initialization
$(document).ready(function() {
	soysauce.scrollTop();
	soysauce.init();
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
		var type = $(this).attr("data-ss-widget");
		var widget;
		var orphan = false;
		
		$(this).attr("data-ss-id", ++soysauce.vars.idCount);
		
		if (!type && $(this).attr("data-ss-toggler-id") !== undefined) {
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
		}

		if (widget !== undefined) {
			soysauce.widgets.push(widget);
			$(this).trigger("SSWidgetReady");
			ret = true;
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
			
			overlay.append("<span class='done'>Done</span>");
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
				self.formatInput();
			}
			
		});
	}
	
	autodetectCC.prototype.formatInput = function() {
		var val = this.input.val().replace(/[\s]+/g, "");
		var isAmex = (/^3[47]/.test(val.replace(/[-\s]+/g, ""))) ? true : false;
		var isDC = (/^3(?:0[0-5]|[68][0-9])/.test(val.replace(/[-\s]+/g, "")) && !isAmex) ? true : false;
		
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
	
	autodetectCC.prototype.handleResize = function() {
		// Placeholder - required soysauce function
	};
	
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
	
	autofillZip.prototype.handleResize = function() {
		// Placeholder - required soysauce function
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
		this.use3D = soysauce.vars.SUPPORTS3D;
		
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
			stepSize: 1
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
				case "3d":
					self.use3D = true;
					break;
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

				styleTag.find("+ div").remove();
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
				self.itemWidth = self.widget.width() / self.multiVars.numItems;
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
			setTranslate(self.container[0], self.offset - (margin*2) + (margin/2));

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
				var currXPos = parseInt(soysauce.getArrayFromMatrix(self.container.css(PREFIX + "transform"))[4]);
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
			var self = this;
			var height = $(this.items[this.index]).outerHeight();
			this.widget.css("min-height", height);
		}
		
		this.widget.one("SSWidgetReady", function() {
			self.container.imagesLoaded(function() {
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
			
			// Slide Backward
			if (!resettingPosition && !jumping && this.index === this.numChildren - 2 && !this.forward) {
				this.infiniteID = window.setTimeout(function() {
					xcoord = parseInt(soysauce.getArrayFromMatrix(self.container.css(PREFIX + "transform"))[4]);
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
			// Slide Forward
			else if (!resettingPosition && !jumping && this.index === 1 && this.forward) {
				this.infiniteID = window.setTimeout(function() {
					xcoord = parseInt(soysauce.getArrayFromMatrix(self.container.css(PREFIX + "transform"))[4]);
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
		var self = this;
		var widgetWidth = this.widget.width();
		
		if (this.fade) {
			return;
		}
		
		if (this.multi) {
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
		var xcoord = parseInt(soysauce.getArrayFromMatrix(this.container.css(PREFIX + "transform"))[4]);
		
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
						self.gotoPos(self.index * -self.itemWidth + (self.peekWidth) + self.spacingOffset);
					}
					else {
						self.slideForward(fast);
					}
				}
				else {
					if (!self.infinite && self.index === 0) {
						self.gotoPos((self.peekWidth) + self.spacingOffset);
					}
					else {
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

		this.gotoPos(newOffset, false, true);
		this.index = index;
		
		return true;
	};
	
	// Helper Functions
	function setTranslate(element, x, y) {
		x = (!x) ? 0 : x;
		y =  (!y) ? 0 : y;
		element.style.webkitTransform = 
		element.style.msTransform = 
		element.style.OTransform = 
		element.style.MozTransform = 
		element.style.transform = 
			"translate" + ((soysauce.vars.SUPPORTS3D) ? "3d(" + x + "px," + y + "px,0)": "(" + x + "px," + y + "px)");
	}
	
	function setScale(element, multiplier) {
		var currTransform = element.style.webkitTransform;
		multiplier = (!multiplier) ? ZOOM_MULTIPLIER : multiplier;
		element.style.webkitTransform = 
		element.style.msTransform = 
		element.style.OTransform = 
		element.style.MozTransform = 
		element.style.transform = 
			currTransform + " scale" + ((soysauce.vars.SUPPORTS3D) ? "3d(" + multiplier + "," + multiplier + ",1)" : "(" + multiplier + "," + multiplier + ")");
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

soysauce.lazyloader = (function() {
	var THROTTLE = 100; // milliseconds
	
	function Lazyloader(selector) {
		var options = soysauce.getOptions(selector);
		var self = this;
		
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
	
	Lazyloader.prototype.handleResize = function() {
		// Placeholder - required soysauce function
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
		}
		else {
			this.widget = $(selector);
			this.orphan = false;
			this.allButtons = this.widget.find("> [data-ss-component='button']");
			this.button = this.allButtons.first();
			this.allContent = this.widget.find("> [data-ss-component='content']");
			this.content = this.allContent.first();
		}
		
		this.id = parseInt(this.widget.attr("data-ss-id"));
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
		
		// Ajax
		this.ajax = false;
		this.doAjax = false;
		this.ajaxData;
		this.ajaxing = false;
		
		// Tab
		this.tab = false;
		this.childTabOpen = false;
		
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
				case "slide":
					self.slide = true;
					break;
				case "responsive":
					self.responsive = true;
					self.tab = true;
					break;
			}
		});

		if (this.orphan) return this;

		this.allButtons.append("<span class='icon'></span>");
		this.allContent.wrapInner("<div data-ss-component='wrapper'/>");

		this.hasTogglers = (this.widget.has("[data-ss-widget='toggler']").length > 0) ? true : false; 
		this.isChildToggler = (this.widget.parents("[data-ss-widget='toggler']").length > 0) ? true : false;

		if (this.isChildToggler) {
			var parent = this.widget.parents("[data-ss-widget='toggler']");
			this.parentID = parseInt(parent.attr("data-ss-id"));
			this.parent = parent;
		}

		if (this.widget.attr("data-ss-state") !== undefined && this.widget.attr("data-ss-state") === "open") {
			this.allButtons.attr("data-ss-state", "open");
			this.allContent.attr("data-ss-state", "open");
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
				var height = 0;
				this.content.find("[data-ss-component='button']").each(function() {
					height += self.widget.height();
				});
				this.height = height;
				this.allContent.css("height", "0px");
				this.allContent.attr("data-ss-state", "closed");
			}
			else {
				this.allContent.each(function() {
					var content = $(this);
					content.imagesLoaded(function() {
						content.attr("data-ss-slide-height", content.height());
						content.css("height", "0px");
						content.attr("data-ss-state", "closed");
					});
				});
			}
			this.allContent.on(TRANSITION_END, function() {
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

					if (soysauce.browserInfo.supportsSessionStorage) {
						self.ajaxing = true;
						if (!sessionStorage.getItem(url)) {
							firstTime = true;
							$.ajax({
								url: url,
								type: "GET",
								success: function(data) {
									sessionStorage.setItem(url, JSON.stringify(data));
									if (typeof(data) === "object") {
										self.ajaxData = data;
									}
									else {
										self.ajaxData = JSON.parse(data);
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
				self.height = parseInt(self.content.attr("data-ss-slide-height"));
				self.content.css("height", self.height + "px");
			}
		}

		this.opened = true;
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
	
	Toggler.prototype.handleResize = function() {
		this.adjustFlag = true;
		if (this.state === "open") {
			this.adjustHeight();
		}
		if (this.responsive) {
			this.handleResponsive();
		}
	};
	
	// TODO: this needs improvement; get new height and set it so that it animates on close after a resize/orientation change
	Toggler.prototype.adjustHeight = function() {
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

	Toggler.prototype.toggle = function(e) {
		var self = this;
		
		if (this.freeze || this.ajaxing) return;

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
											this.button[0] === e.target) ? true : false;

			if (this.responsive && !this.responsiveVars.accordions && (this.button[0] === e.target)) return;

			this.close();

			this.button = $(e.target);
			this.content = $(e.target).find("+ [data-ss-component='content']");

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
			this.button = $(e.target);
			this.content = $(e.target).find("+ [data-ss-component='content']");

			var collapse = (this.button.attr("data-ss-state") === "open" &&
											this.button[0] === e.target &&
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
