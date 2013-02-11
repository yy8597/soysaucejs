soysauce.togglers = (function() {
	var TRANSITION_END = "transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd";

	// Togglers
	function Toggler(selector) {
		var self = this;
		var options = soysauce.getOptions(selector);
		var currentViewportWidth = window.innerWidth;
		
		// Base
		this.widget = $(selector);
		this.id = parseInt(this.widget.attr("data-ss-id"));
		this.parentID = 0;
		this.tabID;
		this.state = "closed";
		this.allButtons = this.widget.find("> [data-ss-component='button']");
		this.button = this.allButtons.first();
		this.allContent = this.widget.find("> [data-ss-component='content']");
		this.content = this.allContent.first();
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
		
		// Tab
		this.tab = false;
		this.childTabOpen = false;
		
		// Responsive
		this.responsive = false;
		this.responsiveVars = {
			threshold: (!this.widget.attr("data-ss-responsive-threshold")) ? 0 : parseInt(this.widget.attr("data-ss-responsive-threshold")),
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
		
		// Instance Functions
		this.open = function() {
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
					this.height = parseInt(this.content.attr("data-ss-slide-height"));
					this.content.css("height", this.height + "px");
				}
			}

			this.opened = true;
			this.setState("open");
		};

		this.close = function() {
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
		this.adjustHeight = function() {
			this.adjustFlag = false;
		};

		this.addHeight = function(height) {
			if (!height===+height || !height===(height|0)) return;
			this.height += height;
			this.height = (this.height < 0) ? 0 : this.height;
			this.content.css("height", this.height + "px");
		};

		this.setHeight = function(height) {
			if (!height===+height || !height===(height|0)) return;
			this.height = height;
			this.height = (this.height < 0) ? 0 : this.height;
			this.content.css("height", height + "px");
		};

		this.toggle = function(e) {
			if (this.freeze) return;

			if (this.tab) {
				var collapse = (this.button.attr("data-ss-state") === "open" &&
												this.button[0] === e.target) ? true : false;

				if (this.responsive && !this.responsiveVars.accordions && (this.button[0] === e.target)) return;

				this.close();

				this.button = $(e.target);
				this.content = $(e.target).find("+ [data-ss-component='content']");

				if (this.slide) {
					this.height = parseInt(this.content.attr("data-ss-slide-height"));
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

		this.handleAjax = function() {
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
					if (!sessionStorage.getItem(url)) {
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
				else {
					$.get(url, eval(callback));
				}

				if (!firstTime) {
					self.setAjaxComplete();
				}
			});
		};

		this.setState = function(state) {
			this.state = state;
			this.button.attr("data-ss-state", state);
			this.content.attr("data-ss-state", state);

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

		this.setAjaxComplete = function() {
			this.doAjax = false;
			this.ready = true;
			if (this.state === "open") {
				this.open();
				this.opened = true;
			}
		};

		this.handleFreeze = function() {
			this.freeze = true;
		};

		this.handleUnfreeze = function() {
			this.freeze = false;
		};

		this.handleResponsive = function() {
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
		
		this.handleResize = function(e) {
			if (e.type === "orientationchange") {
				self.adjustFlag = true;
				if (self.state === "open") {
					self.adjustHeight();
				}
				if (self.responsive) {
					self.handleResponsive();
				}
			}
			else {
				if (window.innerWidth !== currentViewportWidth) {
					currentViewportWidth = window.innerWidth;
					self.adjustFlag = true;
					if (self.state === "open") {
						self.adjustHeight();
					}
					if (self.responsive) {
						self.handleResponsive();
					}
				}
			}
		}
		// End of Instance Functions
		
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
			}
			else {
				this.allContent.each(function() {
					$(this).attr("data-ss-slide-height", $(this).height());
				});
			}

			this.allContent.css("height", "0px");
			this.allContent.attr("data-ss-state", "closed");
			this.allContent.on(TRANSITION_END, function() {
				self.ready = true;
			});
		}

		this.allButtons.click(function(e) {
			self.toggle(e);
		});
		
		this.handleResponsive();
	}
	
	return {
		init: function(selector) {
			return new Toggler(selector);
		}
	};
	
})();
