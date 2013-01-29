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
			if (this.isChildAccordion && this.parent.slide && !this.tab)
				this.parent.addHeight(-this.height);
			this.content.css("height", "0px");
		}
		if (this.tab) {
			var currTabOpen;
			currTabOpen = this.tabGroup.getCurrOpen();
			if (currTabOpen !== undefined && currTabOpen.id == self.id) 
				this.tabGroup.setCurrOpen(undefined);	
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
			
			if (item.isChildAccordion) {
				var parent = $(this).parents("[data-ss-widget='accordion']");
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
