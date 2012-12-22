



// Initialize Soysauce object
if(typeof(soysauce) == "undefined") {
	soysauce = {
		init: function() {
			var set = $("[ss-widget]");
			for (var i = 0; i < set.length; i++) {
				$(set[i]).attr("ss-id", i+1);
			}
		},
		setResponsiveButtons: function() {
			
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
		setCarousels: function(selector) {	

			function Carousel() {
				this.options = {
					autoscroll: false,
					dots: false
				}
			}

			var test = new Carousel();
			console.dir(test);

			var carousels = $("[ss-widget='carousel']");
			var scroll_width = $(window).width();

			carousels.each(function(i,e) {
				var carousel = $(e);
				var hasOptions = carousel.attr("ss-options") ? true : false;
				var view_container, scroll_width = 0;
				var options = {
					// User Controllable
					autoscroll: (hasOptions && carousel.attr("ss-options").match("autoscroll")) ? true : false,
					dots: (hasOptions && carousel.attr("ss-options").match("dots")) ? true : false,
					fullscreen: (hasOptions && carousel.attr("ss-options").match("fullscreen")) ? true : false,
					swipe: (hasOptions && carousel.attr("ss-options").match("swipe")) ? true : false,

					// Static
					autoscroll_delay: 5000,
					hasAnchors: (carousel.find("a").length > 0) ? true : false,
					supports3D: ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix()) ? true : false
				};
				var carousel_vars = {
					init_length: 0,
					length: 0,
					index: 1
				};

				if(options.hasAnchors) carousel.find("a").attr("ss-component", "item");
				else carousel.find("img").attr("ss-component", "item");
				carousel_vars.init_length = carousel.find("[ss-component]").length;
				carousel[0].innerHTML = "<div ss-component='view_container'>" + carousel[0].innerHTML + "</div>";

				// Cloning (for infinite scrolling)
				view_container = carousel.find("[ss-component='view_container']");
				first_item = view_container.find("[ss-component='item']").first().clone().appendTo(view_container);
				last_item = view_container.find("[ss-component='item']").last().clone().prependTo(view_container);
				carousel_vars.length = view_container.find("[ss-component='item']").length;

				if(options.fullscreen) scroll_width = $(window).width();

				// only doing webkit for now
				if(options.supports3D) {
					view_container.css("-webkit-transform", "translate3d(-" + scroll_width + "px, 0px, 0px)");
				}

				adjustCarousel();

				// Dots
				if(options.dots) {
					carousel.append("<div ss-component='dots'></div>")
					for (i = 0; i < carousel_vars.init_length; i++) {
						if (i==0)
						carousel.find("[ss-component='dots']").append("<div ss-state='active'></div>");
						else
						carousel.find("[ss-component='dots']").append("<div ss-state='inactive'></div>");
					}
				}

				// Ready State
				carousel.attr("ss-state", "ready");
				view_container.find("[ss-component='item']").attr("ss-state", "inactive");
				view_container.find("[ss-component='item']:nth-child(2)").attr("ss-state", "active");

				if(options.autoscroll) window.setInterval(function() {
					scrollRight();
					}, options.autoscroll_delay);

					function updateIndex(inc) {
						carousel_vars.index += inc;
						view_container.find("[ss-state='active']").attr("ss-state", "inactive");
						$("[ss-component='dots'] [ss-state='active']").attr("ss-state", "inactive");

						if(inc > 0 && (carousel_vars.index == carousel_vars.length - 1)) carousel_vars.index = 1;
						else if(inc < 0 && (carousel_vars.index == 0)) carousel_vars.index = carousel_vars.length - 2;

						$(view_container.find("[ss-component='item']")[carousel_vars.index]).attr("ss-state", "active");
						$(carousel.find("[ss-component='dots'] div")[carousel_vars.index-1]).attr("ss-state", "active");

						return carousel_vars.index;
					}

					function getXPos() {
						var positions = view_container.css("-webkit-transform").match(/matrix\(-?\d+, -?\d+, -?\d+, -?\d+, (-?\d+)/)
						if (!positions) return -scroll_width;
						return parseFloat(positions[1]);
					}

					function scrollRight() {
						if (view_container.attr("ss-state") == "in-transition") return;

						var curr_index = carousel_vars.index;
						var new_index = updateIndex(1);
						var pos = getXPos() - scroll_width;

						view_container.attr("ss-state", "in-transition");

						if (options.supports3D) {
							if (new_index <= curr_index) {
								view_container.css("-webkit-transform", "translate3d(" + pos + "px, 0px, 0px)");
								view_container.one("webkitTransitionEnd", function() {
									window.setTimeout(function() {
										view_container.attr("ss-state", "no-animation");
										}, 0);
										window.setTimeout(function() {
											view_container.attr("ss-state", "idle");
											}, 100);
											view_container.css("-webkit-transform", "translate3d(-" + scroll_width + "px, 0px, 0px)");
										});
									}
									else 
									view_container.css("-webkit-transform", "translate3d(" + pos + "px, 0px, 0px)");
								}
							}

							function swipeRight() {

							}

						});

						// Listeners
						$(window).on("resize orientationchange", adjustCarousel); // Resize, Orientation
						$("body").on("webkitTransitionEnd", "[ss-component='view_container']", function() {
							$(this).attr("ss-state", "idle");
						});

						// temp until swipe is finished
						$("a").on("click", function(e) {
							e.stopImmediatePropagation();
							e.preventDefault();
						});

						$("body").on("touchmove", "[ss-component='view_container']", function(e) {
							console.log(e.originalEvent.touches);
						});

						function adjustCarousel() {
							carousels.each(function(i,e) {
								var carousel = $(e);
								if(carousel.attr("ss-options").match("fullscreen")) {
									var width = $(window).width();
									scroll_width = width;
									var items = $("[ss-widget='carousel'] [ss-component='item']");
									items.css("width", $(window).width() + "px");
									$("[ss-component='view_container']").css("width", items.length * width + "px");
								}
							});
						}


					},
					reset: function(selector) {
						return false;
					},
					hideAddressBar: function() {
						setTimeout(function(){
							window.scrollTo(0, 1);
							}, 0);
						},
						lateloadImages: function(selector) {
							$("[ss-ll-src]").each(function() {
								var curr = $(this);
								var val = curr.attr("ss-ll-src")
								curr.attr("src", val).attr("ss-ll-src", "");
							});
						},
						accordions: {}
						}; // End Soysauce init
					}

					soysauce.init();
					// soysauce.setResponsiveButtons();
					// soysauce.setCCValidation();
					// soysauce.setCarousels();
					// soysauce.hideAddressBar();
					// soysauce.lateloadImages();


soysauce.buttons = (function() {
	var buttons = new Array();
	
	function Button(obj) {
		this.id = $(obj).attr("ss-id");
		this.click = (function() {
			return $(obj).trigger("click");
		})();
	}
	
	// Init
	$("[ss-widget='button']").each(function() {
		var item = new Button(this);
		var options;
		
		options = getOptions(this);

		if(options) {
			var self = this;
			options.forEach(function(option) {
				switch(option) {
					case "arrow":
						$(self).append("<span class='icon'></span>");
						break;
					case "submit":
						$(self).append("<span class='icon'></span>");
						break;
				}
			});
		}
		
		// Listeners for active state
		$(this).on("mousedown touchstart", function(){
			$(this).attr("ss-state", "active");
		});

		// Listeners for inactive state
		$(this).on("touchend mouseup", function(){
			$(this).attr("ss-state", "inactive");
		});

		// Submission Handling
		$("form").submit(function() {
			$(this).find("[ss-options*='submit']").attr("ss-state", "submitting");
		});
		$("body").on("click", "a[ss-options*='submit'], a [ss-options*='submit']", function() {
			$(this).attr("ss-state", "submitting");
		});

		buttons.push(item);
	});
	
	return buttons;
})(); // end responsive buttons



