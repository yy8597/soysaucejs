soysauce.togglers = (function() {
	var TRANSITION_END = "transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd";
	
	// Togglers
	function Toggler(selector, orphan) {
		var self = this;
		var options = soysauce.getOptions(selector);

		// Base
		if (orphan) {
		  var button = $(selector);
			var togglerID = button.attr("data-ss-toggler-id");
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
			this.content.attr("data-ss-id", button.attr("data-ss-id"));
			
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
		}
		
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
			threshold: parseInt(this.widget.attr("data-ss-responsive-threshold")) || 768,
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
      var subWidgets = this.allContent.find("[data-ss-widget]");
      
      this.allContent.css({
        "clear": "both",
        "position": "relative"
      });

      if (!subWidgets.length) {
        this.doResize();
      }
      else {
        subWidgets.each(function(i, e) {
          var widget = soysauce.fetch(e).widget;

          if ((i + 1) !== subWidgets.length) return;
            
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
