soysauce.togglers = (function() {
	var togglers = new Array();
	var togglerTabGroups = new Array();
	var TRANSITION_END = "transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd";
	var currentViewportWidth = window.innerWidth;

	// Toggler Tab Group
	function TogglerTabGroup(id) {
		this.togglers = new Array();
		this.groupid = id;
		this.currOpen;
		this.horizontal = false;
		this.buttonGroup;
	}
	
	TogglerTabGroup.prototype.setCurrOpen = function(selector) {
		this.currOpen = selector;
	};
	
	TogglerTabGroup.prototype.addToggler = function(selector) {
		if (selector === undefined || !typeof(Toggler)) return false;
		this.togglers.push(selector);
	};
	
	TogglerTabGroup.prototype.getCurrOpen = function() {
		return this.currOpen;
	};
	
	TogglerTabGroup.prototype.getID = function() {
		return this.groupid;
	};
	
	TogglerTabGroup.prototype.setHorizontal = function() {
		var self = this;
		this.togglers.forEach(function(toggler, i) {
			if (i === 0) {
				toggler.obj.before("<div data-ss-component='button_group' data-ss-tab-id='" + self.groupid + "'></div>");
				self.buttonGroup = $(toggler.obj[0].previousElementSibling);
				toggler.setState("open");
				self.currOpen = toggler;
			}
			self.buttonGroup.append(toggler.button);
		});
	};

	// Togglers
	function Toggler(obj) {
		this.id = $(obj).attr("data-ss-id");
		this.parentID = 0;
		this.tabID;
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
		this.isChildToggler = false;
		this.hasTogglers = false;
		this.childTabOpen = false;
		this.tabGroup = undefined;
		this.parent = undefined;
		this.ready = true;
		this.adjustFlag = false;
		this.horizontal = false;
		this.freeze = false;
	}

	Toggler.prototype.open = function() {
		if (!this.ready) return;
		
		var self = this;
		var prevHeight = 0;
		if (this.tab) {
			if (this.tabGroup.getCurrOpen() !== undefined) {
				prevHeight = this.tabGroup.getCurrOpen().height;
				this.tabGroup.getCurrOpen().close();
			}
			this.tabGroup.setCurrOpen(self);
		}
		if (this.overlay) 
			soysauce.overlay("on");
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

	Toggler.prototype.close = function(closeOverlay) {
		var self = this;
		
		if (!this.ready) return;
		
		if (this.overlay && (closeOverlay === undefined) ? true : closeOverlay) {
			soysauce.overlay("off");
		}
			
		if (this.slide) {
			this.ready = false;
			if (this.isChildToggler && this.parent.slide && !this.tab) {
				this.parent.addHeight(-this.height);
			}
				this.content.css("height", "0px");
		}
		
		if (this.tab) {
			var currTabOpen;
			currTabOpen = this.tabGroup.getCurrOpen();
			if (currTabOpen !== undefined && currTabOpen.id == self.id) {
				this.tabGroup.setCurrOpen(undefined);
			}
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
		if (this.freeze || this.state === "open" && this.horizontal) return;
		(this.state != "open") ? this.open() : this.close();
	};

	Toggler.prototype.handleAjax = function() {
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

	Toggler.prototype.setState = function(state) {
		this.state = state;
		this.obj.attr("data-ss-state", state);
		this.button.attr("data-ss-state", state);
		this.content.attr("data-ss-state", state);
	};

	Toggler.prototype.setAjaxComplete = function() {
		this.doAjax = false;
		this.ready = true;
		if (this.state === "ajaxing")
			this.open();
	};

	Toggler.prototype.handleFreeze = function() {
		this.freeze = true;
	};

	Toggler.prototype.handleUnfreeze = function() {
		this.freeze = false;
	};
	
	// Initialize
	(function() {
		var tabID = 1;
		var group;
		$("[data-ss-widget='toggler']").each(function() {
			var item = new Toggler(this);
			var self = this;
			var options = soysauce.getOptions(this);

			item.button.append("<span class='icon'></span>");
			item.content.wrapInner("<div data-ss-component='wrapper'/>");

			item.hasTogglers = ($(this).has("[data-ss-widget='toggler']").length > 0) ? true : false; 
			item.isChildToggler = ($(this).parents("[data-ss-widget='toggler']").length > 0) ? true : false;
			
			if (item.isChildToggler) {
				var parent = $(this).parents("[data-ss-widget='toggler']");
				item.parentID = parseInt(parent.attr("data-ss-id"));
				item.parent = parent;
			}

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
					case "horizontal":
						item.horizontal = true;
						break;
				}
			});
			
			if (item.tab) {
				if (!$(self).attr("data-ss-tab-id")) {
					var siblings = $(self).find("~ [data-ss-options*='tab']");
					var group_name = "group"
					group = new TogglerTabGroup(tabID);
					item.tabID = tabID;
					$(self).attr("data-ss-tab-id", tabID);
					siblings.attr("data-ss-tab-id", tabID);
					togglerTabGroups.push(group);
					tabID++;
				} else {
					item.tabID = $(self).attr("data-ss-tab-id");
				}
			}
			
			if (item.slide) {
				item.setState("open");
				if (item.hasTogglers) {
					var height = 0;
					item.content.find("[data-ss-component='button']").each(function() {
						height += $(this).height();
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
			}
			
			item.button.click(function() {
				item.toggle();
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
			togglers.push(item);
		});
		togglers.forEach(function(toggler) {
			if (toggler.tabID !== undefined) {
				var group = togglerTabGroups[toggler.tabID - 1];
				group.addToggler(toggler);
				toggler.tabGroup = group;
				if (toggler.horizontal) {
					group.horizontal = true;
				}
			}
		});
		togglerTabGroups.forEach(function(group) {
			if (group.horizontal) {
				group.setHorizontal();
			}
		});
	})(); // end init

	return togglers;
})();

soysauce.togglers.forEach(function(toggler) {
	if (toggler.state === "closed") {
		toggler.setState("closed");
	}
});
