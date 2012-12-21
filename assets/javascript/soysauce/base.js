if(typeof(soysauce) == "undefined") {
	
soysauce = {
	init: function() {
		var set = $("[ss-widget]");
		for (var i = 0; i < set.length; i++) {
				$(set[i]).attr("ss-id", i+1);
		}
	},
	getOptions: function(selector) {
		if($(selector).attr("ss-options") == undefined) return false;
		return $(selector).attr("ss-options").split(" ");
	},
	stifle: function(e) {
		if (e === undefined) return false;
		e.stopImmediatePropagation();
		e.preventDefault();
	},
	fetch: function(selector) { // Fetch by ID
		if (selector === undefined) return false;
		if (typeof(selector) === "object") selector = $(selector).attr("ss-id");
		if (selector===+selector && selector===(selector|0) || selector.match(/^\d+$/).length > 0) {
			var query = "[ss-id='" + selector + "']";
			var type = $(query).attr("ss-widget");
			var ret;
			selector = parseInt(selector);
			switch(type) {
				case "accordion":
					soysauce.accordions.forEach(function(e) {
						if (e.id == selector) ret = e;
					});
					return ret;
			}
		}
		// Fetch by Selector
		else {
			console.log("else");
		}
	},
	browserInfo: {
		userAgent: navigator.userAgent,
		supportsSVG: (document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")) ? true : false,
		supportsLocalStorage: (typeof(window.localStorage)) ? true : false,
		supportsSessionStorage: (typeof(window.sessionStorage)) ? true : false
	},
	accordions: {},
	buttons: {},
	lateload: {},
	overlay: {}
}

soysauce.init();

}
