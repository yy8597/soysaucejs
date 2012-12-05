// To Do (public functions):
// - load()
// - callbacks
// - reset()

if (typeof jQuery == "undefined") console.warn("Soysauce: jQuery is undefined");
else {
	jQuery(document).ready(function($) {
		
		// Add hasAttr() function to jQuery
		$.fn.hasAttr = function(attr) {
			return this.attr(attr) !== undefined;
		} 
		
		// Initialize BB object
		if(typeof(BB) == "undefined") {
			BB = {
				error: function(msg) {
					console.error("Soysauce Errors: " + msg);
				},
				soysauce: {
					setIDs: function() {
						var set = $("[ss-widget]");
						for (var i = 0; i < set.length; i++) {
							$(set[i]).attr("ss-id", i+1);
						}
					},
					setResponsiveButtons: function() {
						// Listeners for active state
						$("body").on("mousedown touchstart", "[ss-widget='button']", function(e){
							$(this).attr("ss-state", "active");
						});

						// Listeners for inactive state
						$("body").on("touchend mouseup", "[ss-widget='button']", function(e){
							$(this).attr("ss-state", "inactive");
						});
						
						// Inject icon if there's an arrow/submit
						$("[ss-widget='button'][ss-options]").each(function() {
							if($(this).attr("ss-options").match(/(arrow|submit)/)) $(this)[0].insert("<span class='icon'></span>");
						});
						
						// Submission Handling
						$("form").submit(function() {
							$(this).find("[ss-options*='submit']").attr("ss-state", "submitting");
						});
						$("body").on("click", "a[ss-options*='submit'], a [ss-options*='submit']", function(e) {
							$(this).attr("ss-state", "submitting");
						});
					},
					setCCValidation: function(selector) {
						$("body").on("keyup", "[ss-widget='cc_validation']", function(e) {
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
					},
					setAccordions: function(selector) {
						$("[ss-widget='accordion']").find("[ss-component]:not([ss-state])").attr("ss-state", "disabled");
						$("[ss-widget='accordion']").find("[ss-component='button']").append("<span class='icon'></span>");
						// options - overlay, single, slidedown
						
						$("body").on("click", "[ss-component='button']", function(e) {
							var parent = $(this).closest("[ss-widget]");
							
							if($(this).attr("ss-state") == "disabled") {
								parent.find("[ss-component]").attr("ss-state", "enabled");
								$(this).attr("ss-state", "enabled");
							}
							else {
								parent.find("[ss-component]").attr("ss-state", "disabled");
								$(this).attr("ss-state", "disabled");
							}
						});
					},
					reset: function(selector) {
						return false;
					},
					widgets: {},
				}, // End Soysauce namespace
			}; // End BB namespace
		}
		
		BB.soysauce.setIDs();
		BB.soysauce.setResponsiveButtons();
		BB.soysauce.setCCValidation();
		BB.soysauce.setAccordions();
		
		/* 	
		*		Button 
		*  
		*  	The button widget allows for user 
		*		interaction when tapping a button.
		*
		*/
		BB.soysauce.widgets["button"] = (function() {
			return false;
		})();
	});
}

