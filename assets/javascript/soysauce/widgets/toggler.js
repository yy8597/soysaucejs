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
		if (!this.ready) return;
		
		var self = this;
		var prevHeight = 0;
		
		if (this.slide) {
			this.ready = false;
			if (this.adjustFlag) this.content.one(TRANSITION_END, function() {
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
		this.content.css("height", "auto");
		this.height = this.content.height();
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
		}
		else {
			this.responsiveVars.accordions = true;
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
