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
		if (e === undefined) return null;
		if (e.originalEvent !== undefined) e = e.originalEvent;
		if (e.touches && e.touches.length > 0)
			return {x: e.touches[0].clientX, y: e.touches[0].clientY};
		else if (e.clientX != undefined)
			return {x: e.clientX, y: e.clientY};
		else if (e.changedTouches && e.changedTouches.length > 0)
			return {x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY};
		return null;
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
